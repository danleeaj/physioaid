/**
 * AGGREGATE, ANONYMISED DEMONSTRATION DATA — fabricated for the demo.
 * These are not real population statistics. The insights layer only ever
 * shows aggregates; no individual records exist or are displayed.
 */

export type Kpi = {
  id: string;
  label: string;
  value: string;
  delta: string;
};

export type PlanningArea = {
  id: string;
  name: string;
  /** 0–1 — share of screenings suggesting support is recommended. */
  intensity: number;
  screenings: number;
};

export type PlanningSignal = {
  id: string;
  title: string;
  body: string;
};

export const kpis: Kpi[] = [
  {
    id: "screenings",
    label: "Screenings completed",
    value: "1,284",
    delta: "+18% week on week",
  },
  {
    id: "under-confidence",
    label: "Under-confidence profile",
    value: "22%",
    delta: "of completed screenings",
  },
  {
    id: "gait",
    label: "Median gait speed",
    value: "0.94 m/s",
    delta: "stable vs last month",
  },
  {
    id: "referrals",
    label: "Community linkages",
    value: "312",
    delta: "+41 this week",
  },
];

export const planningAreas: PlanningArea[] = [
  { id: "bedok", name: "Bedok", intensity: 0.52, screenings: 176 },
  { id: "tampines", name: "Tampines", intensity: 0.38, screenings: 158 },
  { id: "ang-mo-kio", name: "Ang Mo Kio", intensity: 0.61, screenings: 143 },
  { id: "toa-payoh", name: "Toa Payoh", intensity: 0.68, screenings: 121 },
  { id: "bukit-merah", name: "Bukit Merah", intensity: 0.74, screenings: 117 },
  { id: "hougang", name: "Hougang", intensity: 0.35, screenings: 108 },
  { id: "yishun", name: "Yishun", intensity: 0.47, screenings: 132 },
  { id: "jurong-west", name: "Jurong West", intensity: 0.41, screenings: 126 },
  { id: "woodlands", name: "Woodlands", intensity: 0.44, screenings: 114 },
  { id: "queenstown", name: "Queenstown", intensity: 0.58, screenings: 89 },
];

export const planningSignals: PlanningSignal[] = [
  {
    id: "signal-1",
    title: "Under-confidence clusters in mature estates",
    body: "Bukit Merah and Toa Payoh show under-confidence profiles at roughly 1.6× the average rate — strong candidates for Active Ageing Centre confidence-building programmes.",
  },
  {
    id: "signal-2",
    title: "Floor-rising skip rate rises with age band",
    body: "Older age bands skip the floor-rising test more often. Supervised community sessions may lift completion and surface earlier support needs.",
  },
  {
    id: "signal-3",
    title: "Community linkage follow-through",
    body: "About one in four moderate-risk screenings proceeds to a community linkage within two weeks. Warm handovers at screening time appear to double follow-through.",
  },
];
