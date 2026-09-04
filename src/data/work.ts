export type WorkItem = {
  id: string;
  eyebrow: string;
  title: string;
  summary: string;
  tags: string[];
  links: { label: string; href: string }[];
};

export const workItems: WorkItem[] = [
  {
    id: "decision",
    eyebrow: "01",
    title: "Define the decision",
    summary:
      "Make clear what needs to improve, who owns the decision, and what action the system should support.",
    tags: ["Problem framing", "Process ownership"],
    links: [
      {
        label: "Read the related article",
        href: "https://www.vuonogroup.com/blog/ai-value-starts-where-business-process-changes"
      }
    ]
  },
  {
    id: "signal",
    eyebrow: "02",
    title: "Trace the signal",
    summary:
      "Find where the relevant observation enters the process, how it is recorded, and which gaps or delays make it unreliable.",
    tags: ["Data quality", "Data architecture"],
    links: [
      {
        label: "Read about data-quality patterns",
        href: "https://www.vuonogroup.com/blog/bad-data-is-a-symptom-process-patterns-blocking-ai-value"
      }
    ]
  },
  {
    id: "system",
    eyebrow: "03",
    title: "Build and test the system",
    summary:
      "Develop the data workflow and model together, with evaluation criteria for accuracy, reliability, runtime, and operational constraints.",
    tags: ["Machine learning", "Software", "Evaluation"],
    links: [
      { label: "Browse research and code", href: "/research/" }
    ]
  },
  {
    id: "use",
    eyebrow: "04",
    title: "Put it into use",
    summary:
      "Connect the output to an owner, a working routine, and feedback from the outcome. Plan the handover as part of the technical work.",
    tags: ["Delivery", "Feedback", "Handover"],
    links: [
      {
        label: "Read the related article",
        href: "https://www.vuonogroup.com/blog/ai-value-starts-where-business-process-changes"
      }
    ]
  }
];

export type ExternalCase = {
  label: string;
  title: string;
  date: string;
  dateISO: string;
  summary: string;
  body: string;
  details: { label: string; value: string }[];
  href: string;
};

// Listed once here and ordered newest first, so every page that shows public
// references stays in the same order. Add a new case with its dateISO and the
// sort keeps the list current.
const externalCaseList: ExternalCase[] = [
  {
    label: "External case study · Vuono Group",
    title: "Data architecture and AI strategy for Storia",
    date: "September 2026",
    dateISO: "2026-09-04",
    summary:
      "Vuono Group's public case describes an architecture and strategy project for Storia, a logistics company with over a century of operations. The work turned extensive historical operational data into a prioritised plan for analytics and AI.",
    body:
      "The result aligned leadership and IT on one plan: mapped data flows, an integration platform strategy, and prioritised AI use cases with a foundation for real-time analytics.",
    details: [
      {
        label: "Problem",
        value:
          "Make sense of a century of operational data and an ongoing ERP transformation with a clear architecture and AI strategy."
      },
      {
        label: "Work",
        value:
          "Design a data-driven IT architecture and integration strategy, map end-to-end data flows, and prioritise analytics and AI opportunities."
      },
      {
        label: "Result",
        value:
          "A shared architecture direction and prioritised AI use cases, with a foundation for real-time analytics and predictive capabilities."
      }
    ],
    href: "https://www.vuonogroup.com/blog/case-storia-architecture-and-supply-chain-processes-in-logistics-company"
  },
  {
    label: "External case study · Vuono Group",
    title: "Ultrasonic wind estimation for EXC Group",
    date: "March 2026",
    dateISO: "2026-03-24",
    summary:
      "Vuono Group's public case describes an R&D project I drove for EXC Group. The work turned ultrasonic measurement data into a repeatable workflow for developing and comparing wind-estimation methods.",
    body:
      "The result gave the R&D team a repeatable basis for decisions: measured and synthetic data, explicit benchmarks, comparable algorithms, and a modular software baseline for embedded development.",
    details: [
      {
        label: "Problem",
        value: "Estimate wind from ultrasonic measurement data across changing conditions."
      },
      {
        label: "Work",
        value:
          "Build an end-to-end signal-processing and benchmarking workflow with measured and synthetic data."
      },
      {
        label: "Result",
        value:
          "A repeatable way to compare algorithms, parameters, and hardware, with a modular software baseline for embedded development."
      }
    ],
    href: "https://www.vuonogroup.com/blog/case-excgroup-ai-driven-rd-process-with-ultrasonic-wind-estimation-data"
  }
];

export const externalCases: ExternalCase[] = [...externalCaseList].sort((a, b) =>
  b.dateISO.localeCompare(a.dateISO)
);

export const workScale = [
  {
    value: "10+ years",
    label: "working across machine-learning research, software, data systems, and applied delivery"
  },
  {
    value: "5+ years",
    label: "leading projects from planning through technical delivery"
  },
  {
    value: "10-person team",
    label: "managed for three years in a multidisciplinary research environment"
  }
] as const;
