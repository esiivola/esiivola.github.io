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

export const externalCase = {
  label: "External case study · Vuono Group",
  title: "Ultrasonic wind estimation for EXC Group",
  summary:
    "Vuono Group's public case describes an R&D project I drove for EXC Group. The work turned ultrasonic measurement data into a repeatable workflow for developing and comparing wind-estimation methods.",
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
} as const;

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
