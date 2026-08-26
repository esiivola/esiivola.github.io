import { afterEach, describe, expect, it } from "vitest";
import { initLinkedInEmbeds } from "../src/scripts/media-embeds";
import { MEDIA_CONSENT_KEY, setMediaConsent } from "../src/scripts/consent";

function embedMarkup() {
  document.body.innerHTML = `
    <figure data-linkedin-embed
            data-embed-src="https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:123?compact=1"
            data-embed-title="Test video"
            data-embed-state="blocked">
      <div class="li-embed-frame-wrap">
        <div class="li-embed-placeholder" data-embed-placeholder>
          <button type="button" data-embed-allow>Allow and load video</button>
        </div>
      </div>
    </figure>
  `;
}

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => Array.from(values.keys())[index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, String(value))
  };
}

const frame = () => document.querySelector("iframe");
const placeholder = () => document.querySelector<HTMLElement>("[data-embed-placeholder]")!;

afterEach(() => {
  document.body.innerHTML = "";
});

describe("LinkedIn embed consent gate", () => {
  it("keeps the iframe blocked until consent exists", () => {
    embedMarkup();
    const storage = memoryStorage();

    initLinkedInEmbeds({ storage });

    expect(frame()).toBeNull();
    expect(placeholder().hidden).toBe(false);
  });

  it("loads the iframe immediately when consent was already granted", () => {
    embedMarkup();
    const storage = memoryStorage();
    storage.setItem(MEDIA_CONSENT_KEY, "granted");

    initLinkedInEmbeds({ storage });

    expect(frame()?.getAttribute("src")).toBe(
      "https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:123?compact=1"
    );
    expect(frame()?.getAttribute("title")).toBe("Test video");
    expect(placeholder().hidden).toBe(true);
  });

  it("loads the iframe when the in-place allow button is used", () => {
    embedMarkup();
    const storage = memoryStorage();

    initLinkedInEmbeds({ storage });
    document.querySelector<HTMLButtonElement>("[data-embed-allow]")!.click();

    expect(storage.getItem(MEDIA_CONSENT_KEY)).toBe("granted");
    expect(frame()).not.toBeNull();
    expect(placeholder().hidden).toBe(true);
  });

  it("removes the iframe when consent is later revoked", () => {
    embedMarkup();
    const storage = memoryStorage();
    storage.setItem(MEDIA_CONSENT_KEY, "granted");

    initLinkedInEmbeds({ storage });
    expect(frame()).not.toBeNull();

    setMediaConsent("denied", { document, storage });

    expect(frame()).toBeNull();
    expect(placeholder().hidden).toBe(false);
  });
});
