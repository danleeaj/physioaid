export const PRODUCT_NAME = "Physio-Aid";

export const PRODUCT_POSITIONING =
  "A web-based physiotherapy support platform for healthspan, frailty progression, and falls-related decision support.";

export const DECISION_SUPPORT_DISCLAIMER =
  "Physio-Aid provides decision support and screening information. It is not a diagnosis and does not replace assessment by a qualified healthcare professional.";

export const safetyQuestions = [
  { id: "dizziness", label: "Are you feeling dizzy today?", blocksTest: true },
  {
    id: "breathlessness",
    label: "Are you unusually breathless today?",
    blocksTest: true,
  },
  {
    id: "pain",
    label:
      "Do you have chest pain, severe pain, or pain that makes standing unsafe?",
    blocksTest: true,
  },
  {
    id: "recentFallOrInjury",
    label: "Have you had a recent fall or injury that has not been reviewed?",
    blocksTest: true,
  },
  {
    id: "needsSupervision",
    label: "Do you need someone nearby to stand safely?",
    blocksTest: false,
  },
] as const;
