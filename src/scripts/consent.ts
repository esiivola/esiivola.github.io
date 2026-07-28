export const ANALYTICS_CONSENT_KEY = "eero-analytics-consent-v1";

export type AnalyticsConsent = "granted" | "denied";

type AnalyticsWindow = Window &
  typeof globalThis & {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  };

interface ConsentOptions {
  document?: Document;
  window?: AnalyticsWindow;
  storage?: Storage | null;
}

function isAnalyticsConsent(value: string | null): value is AnalyticsConsent {
  return value === "granted" || value === "denied";
}

export function readAnalyticsConsent(storage: Storage | null): AnalyticsConsent | null {
  if (!storage) return null;
  try {
    const value = storage.getItem(ANALYTICS_CONSENT_KEY);
    return isAnalyticsConsent(value) ? value : null;
  } catch {
    return null;
  }
}

export function writeAnalyticsConsent(
  consent: AnalyticsConsent,
  storage: Storage | null
): void {
  if (!storage) return;
  try {
    storage.setItem(ANALYTICS_CONSENT_KEY, consent);
  } catch {
    // Consent still applies to the current page if storage is unavailable.
  }
}

function validMeasurementId(value: string): boolean {
  return /^G-[A-Z0-9]+$/i.test(value);
}

function ensureGtag(win: AnalyticsWindow) {
  const dataLayer = (win.dataLayer = win.dataLayer ?? []);
  win.gtag =
    win.gtag ??
    ((...args: unknown[]) => {
      dataLayer.push(args);
    });
  return win.gtag;
}

function deniedConsent() {
  return {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied"
  };
}

function loadGoogleAnalytics(
  measurementId: string,
  doc: Document,
  win: AnalyticsWindow
): void {
  if (!validMeasurementId(measurementId)) return;

  const scriptId = "google-analytics-tag";
  const gtag = ensureGtag(win);
  gtag("consent", "default", deniedConsent());
  gtag("consent", "update", {
    ...deniedConsent(),
    analytics_storage: "granted"
  });

  if (!doc.getElementById(scriptId)) {
    const script = doc.createElement("script");
    script.id = scriptId;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    doc.head.append(script);
  }

  gtag("js", new Date());
  gtag("config", measurementId);
}

function revokeGoogleAnalytics(doc: Document, win: AnalyticsWindow): void {
  win.gtag?.("consent", "update", deniedConsent());

  for (const cookie of doc.cookie.split(";")) {
    const name = cookie.split("=")[0]?.trim();
    if (!name || !/^_ga(?:_|$)|^_gid$/.test(name)) continue;
    doc.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
  }
}

function showDialog(dialog: HTMLDialogElement): void {
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
}

function closeDialog(dialog: HTMLDialogElement): void {
  if (typeof dialog.close === "function") dialog.close();
  else dialog.removeAttribute("open");
}

export function initializeAnalyticsConsent(options: ConsentOptions = {}) {
  const doc = options.document ?? document;
  const win = options.window ?? (window as AnalyticsWindow);
  let storage = options.storage;
  if (storage === undefined) {
    try {
      storage = win.localStorage;
    } catch {
      storage = null;
    }
  }
  const root = doc.querySelector<HTMLElement>("[data-analytics-consent]");
  if (!root) return () => {};

  const banner = root.querySelector<HTMLElement>("[data-consent-banner]");
  const dialog = root.querySelector<HTMLDialogElement>("[data-consent-dialog]");
  const settingsButtons = Array.from(
    doc.querySelectorAll<HTMLButtonElement>("[data-open-analytics-settings]")
  );
  const choiceButtons = Array.from(
    root.querySelectorAll<HTMLButtonElement>("[data-consent-choice]")
  );
  const closeButtons = Array.from(
    root.querySelectorAll<HTMLButtonElement>("[data-consent-close]")
  );
  const measurementId = root.dataset.analyticsId?.trim() ?? "";

  if (!banner || !dialog) return () => {};

  const setInterfaceState = (consent: AnalyticsConsent | null) => {
    root.dataset.consent = consent ?? "unset";
    banner.hidden = consent !== null;
    settingsButtons.forEach((button) => {
      button.hidden = consent === null;
    });
    root.querySelectorAll<HTMLElement>("[data-consent-status]").forEach((status) => {
      status.textContent =
        consent === "granted"
          ? "Analytics allowed"
          : consent === "denied"
            ? "Analytics declined"
            : "Not decided";
    });
  };

  const applyConsent = (consent: AnalyticsConsent) => {
    writeAnalyticsConsent(consent, storage);
    if (consent === "granted") loadGoogleAnalytics(measurementId, doc, win);
    else revokeGoogleAnalytics(doc, win);
    setInterfaceState(consent);
    closeDialog(dialog);
  };

  const initialConsent = readAnalyticsConsent(storage);
  if (initialConsent === "granted") loadGoogleAnalytics(measurementId, doc, win);
  setInterfaceState(initialConsent);

  const listeners: Array<() => void> = [];

  for (const button of choiceButtons) {
    const listener = () => {
      const choice = button.dataset.consentChoice ?? null;
      if (isAnalyticsConsent(choice)) applyConsent(choice);
    };
    button.addEventListener("click", listener);
    listeners.push(() => button.removeEventListener("click", listener));
  }

  for (const button of settingsButtons) {
    const listener = () => showDialog(dialog);
    button.addEventListener("click", listener);
    listeners.push(() => button.removeEventListener("click", listener));
  }

  for (const button of closeButtons) {
    const listener = () => closeDialog(dialog);
    button.addEventListener("click", listener);
    listeners.push(() => button.removeEventListener("click", listener));
  }

  return () => listeners.forEach((remove) => remove());
}
