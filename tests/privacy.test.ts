import { describe, expect, it } from "vitest";
import { findPrivacyViolations } from "../scripts/check-privacy.mjs";

describe("privacy publication-boundary scan", () => {
  it("ignores CV-like byte sequences inside embedded image data", () => {
    const svg = `<image href="data:image/png;base64,AAAA/cv/BBBB"/>`;

    expect(findPrivacyViolations(svg)).not.toContain("public CV route");
  });

  it("rejects an actual public CV link", () => {
    const html = `<a href="/cv/">Download CV</a>`;

    expect(findPrivacyViolations(html)).toContain("public CV route");
  });
});
