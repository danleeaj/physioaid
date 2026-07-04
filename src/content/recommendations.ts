import type { Recommendation, RiskCategory } from "@/types/assessment";

export const baseRecommendations: Record<RiskCategory, Recommendation[]> = {
  low: [
    {
      id: "maintain-activity",
      title: "Maintain safe activity",
      body: "Continue regular safe movement and monitor changes in confidence or function.",
      type: "maintain_activity",
    },
  ],
  moderate: [
    {
      id: "supported-practice",
      title: "Consider supported practice",
      body: "A supervised or community-based programme may help maintain strength, balance, and confidence.",
      type: "supervised_practice",
    },
    {
      id: "community-linkage",
      title: "Link to community support",
      body: "An Active Ageing Centre or Community Health Post can help with care navigation and follow-up options.",
      type: "community_linkage",
    },
  ],
  high: [
    {
      id: "pause-unsupervised-testing",
      title: "Seek support before further movement testing",
      body: "Avoid continuing unsupervised movement testing today. Consider support from a caregiver, community care worker, or healthcare professional.",
      type: "urgent_safety_advice",
    },
    {
      id: "physiotherapy-review",
      title: "Consider physiotherapy review",
      body: "A physiotherapy review may be helpful if concerns are persistent, worsening, or affecting daily activity.",
      type: "physiotherapy_review",
    },
  ],
};
