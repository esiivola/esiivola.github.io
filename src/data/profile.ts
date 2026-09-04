export const profile = {
  name: "Eero Siivola",
  title: "Data Scientist & AI Architect",
  location: "Helsinki, Finland",
  currentOrganisation: "Vuono Group",
  currentRoleStart: "2026-01",
  experience: "More than ten years in machine learning",
  credential: "Doctor of Science in probabilistic machine learning",
  social: {
    linkedin: "https://www.linkedin.com/in/eerosiivola/",
    github: "https://github.com/esiivola",
    scholar: "https://scholar.google.fi/citations?user=W7oj2YAAAAAJ",
    orcid: "https://orcid.org/0000-0002-3926-9651"
  }
} as const;

export const navigation = [
  { label: "Work", href: "/work/", external: false },
  { label: "Writing", href: "/writing/", external: false },
  { label: "About", href: "/about/", external: false },
  { label: "Contact", href: profile.social.linkedin, external: true }
] as const;

export const facts = [
  { value: "10+ years", label: "working in machine learning" },
  { value: "PhD", label: "in machine learning" },
  { value: "Theory to delivery", label: "models, data systems, and operational use" },
  {
    value: "5+ years",
    label: "leading projects from planning to delivery; three years managing a ten-person team"
  }
] as const;
