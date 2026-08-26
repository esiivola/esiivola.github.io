export type WritingItem = {
  title: string;
  date: string;
  format: "Blog post" | "Guide" | "Research";
  source: string;
  abstract: string;
  tags: string[];
  href: string;
};

export const writingItems: WritingItem[] = [
  {
    title: "Why AI Agents Need Business-Process Context to Work Reliably",
    date: "24 August 2026",
    format: "Blog post",
    source: "AI Finland",
    abstract:
      "Reliable AI agents depend on business-process context and framed autonomy: shared case identifiers, defined process states, and clear boundaries on what an agent may change.",
    tags: ["AI agents", "Business processes", "Framed autonomy"],
    href: "https://aifinland.fi/why-ai-agents-need-business-process-context-to-work-reliably/"
  },
  {
    title: "AI Value Starts Where the Business Process Changes",
    date: "2 June 2026",
    format: "Blog post",
    source: "Vuono Group",
    abstract:
      "AI work creates value only when process ownership and the resulting action are clear.",
    tags: ["AI strategy", "Business processes", "Decision systems"],
    href: "https://www.vuonogroup.com/blog/ai-value-starts-where-business-process-changes"
  },
  {
    title: "Bad Data Is a Symptom: Five Process Patterns That Block AI Value",
    date: "14 April 2026",
    format: "Blog post",
    source: "Vuono Group",
    abstract:
      "Five recurring process problems that produce unreliable data, with questions for finding the cause.",
    tags: ["Data quality", "Process design", "AI readiness"],
    href: "https://www.vuonogroup.com/blog/bad-data-is-a-symptom-process-patterns-blocking-ai-value"
  },
  {
    title: "A Practical Guide to Data Quality in Environmental Water Monitoring",
    date: "2026",
    format: "Guide",
    source: "Finnish Environment Institute",
    abstract:
      "This practical guide covers quality assurance across the full environmental water-monitoring lifecycle, from observation and storage to validation, reporting, and reuse.",
    tags: ["Environmental data", "Quality assurance", "Monitoring"],
    href: "https://helda.helsinki.fi/items/2e603e9f-979a-4179-abe2-0bf9731f94c3"
  }
];
