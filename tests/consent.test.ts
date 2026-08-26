import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ANALYTICS_CONSENT_KEY,
  MEDIA_CONSENT_KEY,
  MEDIA_CONSENT_EVENT,
  initializeConsent
} from "../src/scripts/consent";

function consentMarkup(measurementId = "") {
  document.body.innerHTML = `
    <div data-consent-root data-analytics-id="${measurementId}">
      <section data-consent-banner hidden>Consent</section>
      <button data-open-consent-settings hidden>Settings</button>
      <button data-consent-category="analytics" data-consent-choice="granted">Allow analytics</button>
      <button data-consent-category="analytics" data-consent-choice="denied">Decline analytics</button>
      <button data-consent-category="media" data-consent-choice="granted">Allow media</button>
      <button data-consent-category="media" data-consent-choice="denied">Decline media</button>
      <dialog data-consent-dialog>
        <p data-consent-status data-consent-category="analytics">Not decided</p>
        <p data-consent-status data-consent-category="media">Not decided</p>
        <button data-consent-close>Close</button>
      </dialog>
    </div>
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

const analyticsButton = (choice: "granted" | "denied") =>
  document.querySelector<HTMLButtonElement>(
    `[data-consent-category="analytics"][data-consent-choice="${choice}"]`
  )!;

const mediaButton = (choice: "granted" | "denied") =>
  document.querySelector<HTMLButtonElement>(
    `[data-consent-category="media"][data-consent-choice="${choice}"]`
  )!;

const statusText = (category: "analytics" | "media") =>
  document.querySelector(`[data-consent-status][data-consent-category="${category}"]`)!.textContent;

afterEach(() => {
  document.body.innerHTML = "";
  document.head.querySelector("#google-analytics-tag")?.remove();
  delete (window as typeof window & { dataLayer?: unknown[] }).dataLayer;
  delete (window as typeof window & { gtag?: (...args: unknown[]) => void }).gtag;
  vi.restoreAllMocks();
});

describe("analytics consent", () => {
  it("asks for a choice when no preference has been stored", () => {
    consentMarkup();
    const storage = memoryStorage();

    initializeConsent({ storage });

    expect(document.querySelector<HTMLElement>("[data-consent-banner]")!.hidden).toBe(false);
    expect(document.querySelector<HTMLElement>("[data-open-consent-settings]")!.hidden).toBe(true);
    expect(document.querySelector("[data-consent-root]")!.getAttribute("data-consent")).toBe(
      "unset"
    );
  });

  it("stores a refusal without loading Google Analytics", () => {
    consentMarkup("G-TEST123");
    const storage = memoryStorage();

    initializeConsent({ storage });
    analyticsButton("denied").click();

    expect(storage.getItem(ANALYTICS_CONSENT_KEY)).toBe("denied");
    expect(document.querySelector("#google-analytics-tag")).toBeNull();
    expect(document.querySelector<HTMLElement>("[data-consent-banner]")!.hidden).toBe(true);
    expect(document.querySelector<HTMLElement>("[data-open-consent-settings]")!.hidden).toBe(false);
  });

  it("loads Google Analytics only after explicit acceptance", () => {
    consentMarkup("G-TEST123");
    const storage = memoryStorage();

    initializeConsent({ storage });
    expect(document.querySelector("#google-analytics-tag")).toBeNull();

    analyticsButton("granted").click();

    const script = document.querySelector<HTMLScriptElement>("#google-analytics-tag");
    const commands = (window as typeof window & { dataLayer?: unknown[][] }).dataLayer ?? [];
    expect(storage.getItem(ANALYTICS_CONSENT_KEY)).toBe("granted");
    expect(script?.src).toBe("https://www.googletagmanager.com/gtag/js?id=G-TEST123");
    expect(commands.some((command) => command[0] === "consent" && command[1] === "default")).toBe(
      true
    );
    expect(
      commands.some(
        (command) =>
          command[0] === "consent" &&
          command[1] === "update" &&
          (command[2] as { analytics_storage?: string }).analytics_storage === "granted"
      )
    ).toBe(true);
  });

  it("restores a saved refusal and allows settings to be reopened", () => {
    consentMarkup();
    const storage = memoryStorage();
    storage.setItem(ANALYTICS_CONSENT_KEY, "denied");
    const dialog = document.querySelector<HTMLDialogElement>("dialog")!;
    dialog.showModal = vi.fn(() => dialog.setAttribute("open", ""));

    initializeConsent({ storage });
    document.querySelector<HTMLButtonElement>("[data-open-consent-settings]")!.click();

    expect(dialog.showModal).toHaveBeenCalledOnce();
    expect(dialog.hasAttribute("open")).toBe(true);
    expect(statusText("analytics")).toBe("Analytics declined");
  });
});

describe("media consent", () => {
  it("does not load Google Analytics when only media is decided", () => {
    consentMarkup("G-TEST123");
    const storage = memoryStorage();

    initializeConsent({ storage });
    mediaButton("granted").click();

    expect(storage.getItem(MEDIA_CONSENT_KEY)).toBe("granted");
    expect(storage.getItem(ANALYTICS_CONSENT_KEY)).toBeNull();
    expect(document.querySelector("#google-analytics-tag")).toBeNull();
  });

  it("persists a media decision and broadcasts it for embeds", () => {
    consentMarkup();
    const storage = memoryStorage();
    const received: string[] = [];
    document.addEventListener(MEDIA_CONSENT_EVENT, (event) => {
      received.push((event as CustomEvent<{ consent: string }>).detail.consent);
    });

    initializeConsent({ storage });
    mediaButton("granted").click();
    mediaButton("denied").click();

    expect(received).toEqual(["granted", "denied"]);
    expect(storage.getItem(MEDIA_CONSENT_KEY)).toBe("denied");
    expect(statusText("media")).toBe("Videos declined");
  });

  it("restores a saved media choice in the settings status", () => {
    consentMarkup();
    const storage = memoryStorage();
    storage.setItem(MEDIA_CONSENT_KEY, "granted");

    initializeConsent({ storage });

    expect(statusText("media")).toBe("Videos allowed");
  });
});
