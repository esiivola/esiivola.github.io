export type VideoItem = {
  /** The numeric ugcPost id from the LinkedIn embed URL. */
  urn: string;
  /** Accessible title for the embed and card. */
  title: string;
  /** Optional short line of context shown under the video. */
  caption?: string;
};

// To add a video: copy the ugcPost id from the LinkedIn embed URL
// (…/urn:li:ugcPost:<THIS NUMBER>?compact=1) and append an entry here.
// Newest first.
export const videoItems: VideoItem[] = [
  {
    urn: "7495742349587963904",
    title: "Where data quality actually starts",
    caption:
      "Data quality is decided by how a business process runs and who owns each step, not by cleaning data afterwards. When the process rules are unclear the data keeps breaking, and AI built on it only returns unreliable answers faster."
  },
  {
    urn: "7467830232641724416",
    title: "The question that decides an AI pilot",
    caption:
      "The test of an AI pilot is not model accuracy but whether an insight leads to a decision, a faster response, or a new way of working. The impact starts once people know how to act on what the data shows."
  }
];
