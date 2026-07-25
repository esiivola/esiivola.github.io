export type ResearchItem = {
  context: string;
  title: string;
  year: string;
  summary: string;
  themes: string[];
  links: { label: string; href: string }[];
};

export const researchItems: ResearchItem[] = [
  {
    context: "Recent applied report",
    title: "A Practical Guide to Data Quality in Environmental Water Monitoring",
    year: "2026",
    summary:
      "A co-authored guide to quality assurance across the environmental water-monitoring lifecycle, from observation and storage to validation, reporting, and reuse.",
    themes: ["Data quality", "Environmental monitoring", "Applied guidance"],
    links: [
      {
        label: "Read the guide",
        href: "https://helda.helsinki.fi/items/2e603e9f-979a-4179-abe2-0bf9731f94c3"
      }
    ]
  },
  {
    context: "Recent research",
    title:
      "On Class Imbalance in Machine Learning-Based Taxa Identification: A Comparative Analysis of Mitigation Strategies",
    year: "2026",
    summary:
      "A comparison of methods for learning from highly imbalanced ecological image data, with practical guidance for identifying rare taxa.",
    themes: ["Ecological machine learning", "Class imbalance", "Computer vision"],
    links: [
      {
        label: "Paper",
        href: "https://www.sciencedirect.com/science/article/pii/S2666827026000964"
      }
    ]
  },
  {
    context: "Amazon collaboration",
    title: "Preferential Batch Bayesian Optimization",
    year: "2021",
    summary:
      "A first-author paper from the Amazon collaboration on learning from rankings or comparisons and evaluating several candidates in parallel.",
    themes: ["Preferential feedback", "Bayesian optimisation", "Parallel evaluation"],
    links: [
      {
        label: "Publication record",
        href: "https://research.aalto.fi/en/publications/preferential-batch-bayesian-optimization/"
      },
      { label: "Paper", href: "https://arxiv.org/abs/2003.11435" }
    ]
  },
  {
    context: "Amazon collaboration",
    title:
      "Correcting Boundary Over-Exploration Deficiencies in Bayesian Optimization with Virtual Derivative Sign Observations",
    year: "2018",
    summary:
      "A first-author collaboration with an Amazon researcher on making Bayesian optimisation more efficient by encoding prior knowledge about where the best solution is unlikely to be.",
    themes: ["Bayesian optimisation", "Prior knowledge", "Efficient experimentation"],
    links: [
      {
        label: "Publication record",
        href: "https://research.aalto.fi/en/publications/correcting-boundary-over-exploration-deficiencies-in-bayesian-opt/"
      },
      { label: "Paper", href: "https://arxiv.org/abs/1704.00963" }
    ]
  },
  {
    context: "Novartis collaboration",
    title: "Qualifying Drug Dosing Regimens in Pediatrics Using Gaussian Processes",
    year: "2021",
    summary:
      "A first-author study with Novartis on modelling organ maturation and evaluating pediatric drug-dosing regimens with limited data.",
    themes: ["Medicine", "Gaussian processes", "Applied research"],
    links: [
      {
        label: "Plain-language explanation",
        href: "https://www.aalto.fi/en/news/researchers-develop-better-way-to-determine-safe-drug-doses-for-children"
      },
      { label: "Paper", href: "https://doi.org/10.1002/sim.8907" },
      { label: "Code", href: "https://github.com/esiivola/admegp" }
    ]
  },
  {
    context: "Doctoral dissertation",
    title: "Applications of Human Feedback in Gaussian Processes",
    year: "2021",
    summary:
      "My doctoral dissertation looks at how Gaussian processes can learn from comparisons, rankings, and other feedback when exact measurements are costly or unavailable.",
    themes: ["Gaussian processes", "Human feedback", "Decision-making"],
    links: [
      {
        label: "Aalto record",
        href: "https://research.aalto.fi/en/publications/applications-of-human-feedback-in-gaussian-processes/"
      },
      {
        label: "Thesis PDF",
        href: "https://aaltodoc.aalto.fi/bitstreams/290166c0-5b1a-4ef2-b4ec-ed4d79fc9689/download"
      }
    ]
  },
  {
    context: "Research and open source",
    title: "Good Practices for Bayesian Optimization of High-Dimensional Structured Spaces",
    year: "2020",
    summary:
      "Practical advice for optimisation problems with many structured inputs and expensive evaluations.",
    themes: ["Bayesian optimisation", "Structured spaces", "Open source"],
    links: [
      { label: "Paper", href: "https://arxiv.org/abs/2012.15471" },
      { label: "Code", href: "https://github.com/esiivola/hdssbo" }
    ]
  }
];
