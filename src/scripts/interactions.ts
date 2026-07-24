const focusableSelector =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function initializeNavigation(doc: Document = document): () => void {
  const details = doc.querySelector<HTMLDetailsElement>("[data-mobile-menu]");
  const trigger = details?.querySelector<HTMLElement>("summary");
  const panel = details?.querySelector<HTMLElement>("[data-mobile-panel]");

  if (!details || !trigger || !panel) return () => {};

  const closeMenu = () => {
    details.open = false;
    doc.documentElement.classList.remove("menu-open");
    trigger.focus();
  };

  const onToggle = () => {
    doc.documentElement.classList.toggle("menu-open", details.open);
    if (details.open) {
      panel.querySelector<HTMLElement>(focusableSelector)?.focus();
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (!details.open) return;

    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
      return;
    }

    if (event.key !== "Tab") return;

    const focusable = [trigger, ...panel.querySelectorAll<HTMLElement>(focusableSelector)];
    if (focusable.length < 2) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && doc.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && doc.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const onPanelClick = (event: Event) => {
    if ((event.target as Element).closest("a")) closeMenu();
  };

  details.addEventListener("toggle", onToggle);
  doc.addEventListener("keydown", onKeyDown);
  panel.addEventListener("click", onPanelClick);

  return () => {
    details.removeEventListener("toggle", onToggle);
    doc.removeEventListener("keydown", onKeyDown);
    panel.removeEventListener("click", onPanelClick);
  };
}

export function initializeSignalSystemImpact(doc: Document = document): () => void {
  const model = doc.querySelector<HTMLElement>("[data-operating-model]");
  if (!model) return () => {};

  const stages = Array.from(model.querySelectorAll<HTMLElement>("[data-stage]"));
  const activate = (stage: HTMLElement) => {
    stages.forEach((item) => {
      const active = item === stage;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-current", active ? "step" : "false");
    });
    model.dataset.active = stage.dataset.stage ?? "";
  };

  const listeners = stages.flatMap((stage) => {
    const onActivate = () => activate(stage);
    stage.addEventListener("mouseenter", onActivate);
    stage.addEventListener("focusin", onActivate);
    stage.addEventListener("click", onActivate);
    return [
      () => stage.removeEventListener("mouseenter", onActivate),
      () => stage.removeEventListener("focusin", onActivate),
      () => stage.removeEventListener("click", onActivate)
    ];
  });

  if (stages[0]) activate(stages[0]);
  return () => listeners.forEach((remove) => remove());
}

export function initializeDeepLinks(
  doc: Document = document,
  hash: string = doc.defaultView?.location.hash ?? ""
): () => void {
  if (!hash || hash === "#") return () => {};

  const id = decodeURIComponent(hash.slice(1));
  const target = doc.getElementById(id);
  if (!target) return () => {};

  let cancelled = false;
  const frame = doc.defaultView?.requestAnimationFrame?.bind(doc.defaultView);
  const scroll = () => {
    if (!cancelled) target.scrollIntoView({ block: "start" });
  };

  if (frame) frame(() => frame(scroll));
  else scroll();

  return () => {
    cancelled = true;
  };
}

export function initializeSite(doc: Document = document): () => void {
  doc.documentElement.classList.add("has-js");
  const cleanups = [
    initializeNavigation(doc),
    initializeSignalSystemImpact(doc),
    initializeDeepLinks(doc)
  ];
  return () => cleanups.forEach((cleanup) => cleanup());
}
