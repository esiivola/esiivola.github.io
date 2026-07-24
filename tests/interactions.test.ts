import { afterEach, describe, expect, it, vi } from "vitest";
import {
  initializeDeepLinks,
  initializeNavigation,
  initializeSignalSystemImpact
} from "../src/scripts/interactions";

afterEach(() => {
  document.body.innerHTML = "";
  document.documentElement.className = "";
});

describe("mobile navigation", () => {
  it("closes on Escape and returns focus to the trigger", () => {
    document.body.innerHTML = `
      <details data-mobile-menu open>
        <summary>Menu</summary>
        <nav data-mobile-panel><a href="/work/">Work</a></nav>
      </details>
    `;
    const details = document.querySelector("details")!;
    const trigger = document.querySelector("summary")!;
    initializeNavigation(document);

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

    expect(details.open).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it("contains forward keyboard focus while open", () => {
    document.body.innerHTML = `
      <details data-mobile-menu open>
        <summary>Menu</summary>
        <nav data-mobile-panel>
          <a href="/work/">Work</a>
          <a href="/about/">About</a>
        </nav>
      </details>
    `;
    const trigger = document.querySelector("summary")!;
    const links = document.querySelectorAll("a");
    initializeNavigation(document);
    links[1].focus();

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));

    expect(document.activeElement).toBe(trigger);
  });
});

describe("Signal → System → Impact model", () => {
  it("activates a stage on keyboard focus without hiding the other content", () => {
    document.body.innerHTML = `
      <div data-operating-model>
        <article data-stage="signal" tabindex="0">Signal</article>
        <article data-stage="system" tabindex="0">System</article>
      </div>
    `;
    initializeSignalSystemImpact(document);
    const model = document.querySelector<HTMLElement>("[data-operating-model]")!;
    const stages = document.querySelectorAll<HTMLElement>("[data-stage]");

    stages[1].dispatchEvent(new FocusEvent("focusin", { bubbles: true }));

    expect(model.dataset.active).toBe("system");
    expect(stages[1].classList.contains("is-active")).toBe(true);
    expect(stages[0].textContent).toContain("Signal");
  });
});

describe("deep links", () => {
  it("restores the target position after the page layout is ready", () => {
    document.body.innerHTML = `<section id="process-change">Target</section>`;
    const target = document.getElementById("process-change")!;
    const scrollIntoView = vi.fn();
    const animationFrame = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((callback) => {
        callback(0);
        return 1;
      });
    target.scrollIntoView = scrollIntoView;

    initializeDeepLinks(document, "#process-change");

    expect(scrollIntoView).toHaveBeenCalledWith({ block: "start" });
    animationFrame.mockRestore();
  });
});
