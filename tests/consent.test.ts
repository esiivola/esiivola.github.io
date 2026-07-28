import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ANALYTICS_CONSENT_KEY,
  initializeAnalyticsConsent
} from "../src/scripts/consent";

function consentMarkup(measurementId = "") {
  document.body.innerHTML = `
    <div data-analytics-consent data-analytics-id="${measurementId}">
      <section data-consent-banner hidden>Consent</section>
      <button data-open-analytics-settings hidden>Settings</button>
      <button data-consent-choice="granted">Allow</button>
      <button data-consent-choice="denied">Decline</button>
      <dialog data-consent-dialog>
        <p data-consent-status>Not decided</p>
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

    initializeAnalyticsConsent({ storage });

    expect(document.querySelector<HTMLElement>("[data-consent-banner]")!.hidden).toBe(false);
    expect(document.querySelector<HTMLElement>("[data-open-analytics-settings]")!.hidden).toBe(
      true
    );
    expect(document.querySelector("[data-analytics-consent]")!.getAttribute("data-consent")).toBe(
      "unset"
    );
  });

  it("stores a refusal without loading Google Analytics", () => {
    consentMarkup("G-TEST123");
    const storage = memoryStorage();

    initializeAnalyticsConsent({ storage });
    document.querySelector<HTMLButtonElement>('[data-consent-choice="denied"]')!.click();

    expect(storage.getItem(ANALYTICS_CONSENT_KEY)).toBe("denied");
    expect(document.querySelector("#google-analytics-tag")).toBeNull();
    expect(document.querySelector<HTMLElement>("[data-consent-banner]")!.hidden).toBe(true);
    expect(document.querySelector<HTMLElement>("[data-open-analytics-settings]")!.hidden).toBe(
      false
    );
  });

  it("loads Google Analytics only after explicit acceptance", () => {
    consentMarkup("G-TEST123");
    const storage = memoryStorage();

    initializeAnalyticsConsent({ storage });
    expect(document.querySelector("#google-analytics-tag")).toBeNull();

    document.querySelector<HTMLButtonElement>('[data-consent-choice="granted"]')!.click();

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

    initializeAnalyticsConsent({ storage });
    document.querySelector<HTMLButtonElement>("[data-open-analytics-settings]")!.click();

    expect(dialog.showModal).toHaveBeenCalledOnce();
    expect(dialog.hasAttribute("open")).toBe(true);
    expect(document.querySelector("[data-consent-status]")!.textContent).toBe(
      "Analytics declined"
    );
  });
});
