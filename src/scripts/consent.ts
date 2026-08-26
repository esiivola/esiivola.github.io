export const ANALYTICS_CONSENT_KEY = "eero-analytics-consent-v1";
export const MEDIA_CONSENT_KEY = "eero-media-consent-v1";
export const MEDIA_CONSENT_EVENT = "eero:media-consent";

export type Consent = "granted" | "denied";
/** @deprecated Use {@link Consent}. Retained for existing imports. */
export type AnalyticsConsent = Consent;

type ConsentCategory = "analytics" | "media";

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

interface MediaConsentOptions {
  document?: Document;
  storage?: Storage | null;
}

function isConsent(value: string | null): value is Consent {
  return value === "granted" || value === "denied";
}

function readConsent(key: string, storage: Storage | null): Consent | null {
  if (!storage) return null;
  try {
    const value = storage.getItem(key);
    return isConsent(value) ? value : null;
  } catch {
    return null;
  }
}

function writeConsent(key: string, consent: Consent, storage: Storage | null): void {
  if (!storage) return;
  try {
    storage.setItem(key, consent);
  } catch {
    // Consent still applies to the current page if storage is unavailable.
  }
}

export function readAnalyticsConsent(storage: Storage | null): Consent | null {
  return readConsent(ANALYTICS_CONSENT_KEY, storage);
}

export function writeAnalyticsConsent(consent: Consent, storage: Storage | null): void {
  writeConsent(ANALYTICS_CONSENT_KEY, consent, storage);
}

export function readMediaConsent(storage: Storage | null): Consent | null {
  return readConsent(MEDIA_CONSENT_KEY, storage);
}

export function writeMediaConsent(consent: Consent, storage: Storage | null): void {
  writeConsent(MEDIA_CONSENT_KEY, consent, storage);
}

/**
 * Persist a media-consent decision and broadcast it so any embedded players on
 * the page load or unload themselves in response. Called both from the consent
 * dialog and from the in-place prompt shown on each embed.
 */
export function setMediaConsent(consent: Consent, options: MediaConsentOptions = {}): void {
  const doc = options.document ?? document;
  let storage = options.storage;
  if (storage === undefined) storage = safeStorage(doc.defaultView as AnalyticsWindow | null);
  writeMediaConsent(consent, storage);
  doc.dispatchEvent(new CustomEvent<{ consent: Consent }>(MEDIA_CONSENT_EVENT, { detail: { consent } }));
}

function safeStorage(win: AnalyticsWindow | null): Storage | null {
  try {
    return win?.localStorage ?? null;
  } catch {
    return null;
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

function statusText(consent: Consent | null): string {
  return consent === "granted"
    ? "Allowed"
    : consent === "denied"
      ? "Declined"
      : "Not decided";
}

/**
 * Wire the consent surface: the first-run analytics banner, the reopenable
 * settings dialog (analytics and embedded-media rows), and the floating
 * settings button. Analytics consent gates Google Analytics; media consent is
 * persisted and broadcast for embedded players to react to.
 */
export function initializeConsent(options: ConsentOptions = {}) {
  const doc = options.document ?? document;
  const win = options.window ?? (window as AnalyticsWindow);
  let storage = options.storage;
  if (storage === undefined) storage = safeStorage(win);

  const root = doc.querySelector<HTMLElement>("[data-consent-root]");
  if (!root) return () => {};

  const banner = root.querySelector<HTMLElement>("[data-consent-banner]");
  const dialog = root.querySelector<HTMLDialogElement>("[data-consent-dialog]");
  const settingsButtons = Array.from(
    doc.querySelectorAll<HTMLButtonElement>("[data-open-consent-settings]")
  );
  const choiceButtons = Array.from(
    root.querySelectorAll<HTMLButtonElement>("[data-consent-choice]")
  );
  const closeButtons = Array.from(
    root.querySelectorAll<HTMLButtonElement>("[data-consent-close]")
  );
  const measurementId = root.dataset.analyticsId?.trim() ?? "";

  if (!banner || !dialog) return () => {};

  const setStatus = (category: ConsentCategory, consent: Consent | null) => {
    root
      .querySelectorAll<HTMLElement>(`[data-consent-status][data-consent-category="${category}"]`)
      .forEach((status) => {
        status.textContent = `${category === "media" ? "Videos" : "Analytics"} ${statusText(
          consent
        ).toLowerCase()}`;
      });
  };

  const setAnalyticsInterface = (consent: Consent | null) => {
    root.dataset.consent = consent ?? "unset";
    banner.hidden = consent !== null;
    settingsButtons.forEach((button) => {
      button.hidden = consent === null;
    });
    setStatus("analytics", consent);
  };

  const applyAnalytics = (consent: Consent) => {
    writeAnalyticsConsent(consent, storage);
    if (consent === "granted") loadGoogleAnalytics(measurementId, doc, win);
    else revokeGoogleAnalytics(doc, win);
    setAnalyticsInterface(consent);
    closeDialog(dialog);
  };

  const applyMedia = (consent: Consent) => {
    setMediaConsent(consent, { document: doc, storage });
    closeDialog(dialog);
  };

  const initialAnalytics = readAnalyticsConsent(storage);
  if (initialAnalytics === "granted") loadGoogleAnalytics(measurementId, doc, win);
  setAnalyticsInterface(initialAnalytics);
  setStatus("media", readMediaConsent(storage));

  const listeners: Array<() => void> = [];
  const on = (target: EventTarget, type: string, handler: EventListener) => {
    target.addEventListener(type, handler);
    listeners.push(() => target.removeEventListener(type, handler));
  };

  for (const button of choiceButtons) {
    on(button, "click", () => {
      const choice = button.dataset.consentChoice ?? null;
      if (!isConsent(choice)) return;
      const category = button.dataset.consentCategory === "media" ? "media" : "analytics";
      if (category === "media") applyMedia(choice);
      else applyAnalytics(choice);
    });
  }

  for (const button of settingsButtons) on(button, "click", () => showDialog(dialog));
  for (const button of closeButtons) on(button, "click", () => closeDialog(dialog));

  // Keep the dialog's media status in sync with in-place prompts on embeds.
  on(doc, MEDIA_CONSENT_EVENT, ((event: CustomEvent<{ consent: Consent }>) => {
    setStatus("media", event.detail?.consent ?? readMediaConsent(storage));
  }) as EventListener);

  return () => listeners.forEach((remove) => remove());
}
