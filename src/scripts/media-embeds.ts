import {
  MEDIA_CONSENT_EVENT,
  readMediaConsent,
  setMediaConsent,
  type Consent
} from "./consent";

interface MediaEmbedOptions {
  document?: Document;
  storage?: Storage | null;
}

function safeStorage(win: Window | null): Storage | null {
  try {
    return win?.localStorage ?? null;
  } catch {
    return null;
  }
}

function mountFrame(embed: HTMLElement): void {
  const src = embed.dataset.embedSrc;
  if (!src || embed.querySelector("iframe")) return;

  const frame = embed.ownerDocument.createElement("iframe");
  frame.src = src;
  frame.title = embed.dataset.embedTitle || "Embedded LinkedIn video";
  frame.className = "li-embed-frame";
  frame.loading = "lazy";
  frame.setAttribute("frameborder", "0");
  frame.setAttribute("allow", "fullscreen; encrypted-media; picture-in-picture");
  frame.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
  frame.allowFullscreen = true;

  const placeholder = embed.querySelector<HTMLElement>("[data-embed-placeholder]");
  if (placeholder) placeholder.hidden = true;
  embed.append(frame);
  embed.dataset.embedState = "loaded";
}

function unmountFrame(embed: HTMLElement): void {
  embed.querySelector("iframe")?.remove();
  const placeholder = embed.querySelector<HTMLElement>("[data-embed-placeholder]");
  if (placeholder) placeholder.hidden = false;
  embed.dataset.embedState = "blocked";
}

/**
 * Consent-gate LinkedIn video embeds using the content-blocker pattern: the
 * third-party iframe is only injected once media consent is granted. Until
 * then each embed shows its in-place explanation and an "allow" control. The
 * gate reacts live to consent changes made anywhere on the page.
 */
export function initLinkedInEmbeds(options: MediaEmbedOptions = {}) {
  const doc = options.document ?? document;
  const embeds = Array.from(doc.querySelectorAll<HTMLElement>("[data-linkedin-embed]"));
  if (!embeds.length) return () => {};

  let storage = options.storage;
  if (storage === undefined) storage = safeStorage(doc.defaultView);

  const render = (consent: Consent | null) => {
    for (const embed of embeds) {
      if (consent === "granted") mountFrame(embed);
      else unmountFrame(embed);
    }
  };

  render(readMediaConsent(storage));

  const onAllow = (event: Event) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest("[data-embed-allow]")) {
      setMediaConsent("granted", { document: doc, storage });
    }
  };
  doc.addEventListener("click", onAllow);

  const onConsentChange = ((event: CustomEvent<{ consent: Consent }>) => {
    render(event.detail?.consent ?? readMediaConsent(storage));
  }) as EventListener;
  doc.addEventListener(MEDIA_CONSENT_EVENT, onConsentChange);

  return () => {
    doc.removeEventListener("click", onAllow);
    doc.removeEventListener(MEDIA_CONSENT_EVENT, onConsentChange);
  };
}
