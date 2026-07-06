/**
 * DEMONSTRATION DATA — fictional clinic listings for the demo.
 * Addresses, phone numbers, and names are fabricated. The clinic types
 * and services reflect Singapore's real care landscape but are not real
 * facilities.
 */

export type ClinicType =
  | "physiotherapy"
  | "occupational_therapy"
  | "polyclinic"
  | "community_health_post";

export type Clinic = {
  id: string;
  name: string;
  type: ClinicType;
  area: string;
  address: string;
  phone: string;
  hours: string;
  services: string[];
};

const typeLabels: Record<ClinicType, string> = {
  physiotherapy: "Physiotherapy",
  occupational_therapy: "Occupational Therapy",
  polyclinic: "Polyclinic",
  community_health_post: "Community Health Post",
};

export function clinicTypeLabel(type: ClinicType): string {
  return typeLabels[type];
}

export const clinics: Clinic[] = [
  {
    id: "clinic-bedok-physio",
    name: "Bedok Physio & Rehab",
    type: "physiotherapy",
    area: "Bedok",
    address: "216 Bedok North St 1, #01-08, Singapore 460216",
    phone: "+6562430001",
    hours: "Mon–Fri 9am–6pm, Sat 9am–1pm",
    services: ["falls assessment", "gait rehab", "balance training", "strength conditioning"],
  },
  {
    id: "clinic-tampines-ot",
    name: "Tampines OT Centre",
    type: "occupational_therapy",
    area: "Tampines",
    address: "824 Tampines St 81, #02-12, Singapore 520824",
    phone: "+6562430002",
    hours: "Mon–Fri 9am–5.30pm",
    services: ["daily living skills", "home safety assessment", "confidence building", "adaptive equipment"],
  },
  {
    id: "clinic-amk-chp",
    name: "Ang Mo Kio Community Health Post",
    type: "community_health_post",
    area: "Ang Mo Kio",
    address: "710 Ang Mo Kio Ave 8, #01-2601, Singapore 560710",
    phone: "+6562430003",
    hours: "Mon–Fri 8.30am–5.30pm",
    services: ["falls prevention screening", "care navigation", "community linkage", "exercise programme referral"],
  },
  {
    id: "clinic-tp-physio",
    name: "Toa Payoh Physiotherapy Clinic",
    type: "physiotherapy",
    area: "Toa Payoh",
    address: "190 Lor 6 Toa Payoh, #01-548, Singapore 310190",
    phone: "+6562430004",
    hours: "Mon–Fri 9am–6pm, Sat 9am–12pm",
    services: ["falls assessment", "balance training", "floor transfer practice", "post-fall rehab"],
  },
  {
    id: "clinic-yishun-poly",
    name: "Yishun Polyclinic Rehab",
    type: "polyclinic",
    area: "Yishun",
    address: "2 Yishun Ave 9, Singapore 768898",
    phone: "+6562430005",
    hours: "Mon–Fri 8am–4pm",
    services: ["physiotherapy referral", "falls risk screening", "chronic disease management", "gait assessment"],
  },
  {
    id: "clinic-woodlands-chp",
    name: "Woodlands Community Health Post",
    type: "community_health_post",
    area: "Woodlands",
    address: "305 Woodlands St 31, #01-165, Singapore 730305",
    phone: "+6562430006",
    hours: "Mon–Fri 8.30am–5.30pm",
    services: ["falls prevention", "community linkage", "confidence building programme", "exercise referral"],
  },
  {
    id: "clinic-bm-physio",
    name: "Bukit Merah Physio",
    type: "physiotherapy",
    area: "Bukit Merah",
    address: "116 Bukit Merah View, #01-240, Singapore 151116",
    phone: "+6562430007",
    hours: "Mon–Fri 9am–6pm",
    services: ["balance training", "gait rehab", "strength conditioning", "supervised exercise"],
  },
  {
    id: "clinic-hougang-ot",
    name: "Hougang OT & Wellness",
    type: "occupational_therapy",
    area: "Hougang",
    address: "682 Hougang Ave 4, #01-331, Singapore 530682",
    phone: "+6562430008",
    hours: "Mon–Fri 9am–5pm, Sat 9am–12pm",
    services: ["home safety assessment", "daily living skills", "confidence building", "floor transfer training"],
  },
  {
    id: "clinic-jw-poly",
    name: "Jurong West Polyclinic Rehab",
    type: "polyclinic",
    area: "Jurong West",
    address: "50 Jurong West St 61, Singapore 648201",
    phone: "+6562430009",
    hours: "Mon–Fri 8am–4pm",
    services: ["physiotherapy referral", "falls risk screening", "gait assessment", "chronic disease management"],
  },
  {
    id: "clinic-queenstown-chp",
    name: "Queenstown Community Health Post",
    type: "community_health_post",
    area: "Queenstown",
    address: "166 Stirling Rd, #01-1120, Singapore 140166",
    phone: "+6562430010",
    hours: "Mon–Fri 8.30am–5.30pm",
    services: ["falls prevention screening", "care navigation", "community linkage", "supervised group exercise"],
  },
  {
    id: "clinic-bedok-ot",
    name: "Bedok OT Hub",
    type: "occupational_therapy",
    area: "Bedok",
    address: "537 Bedok North St 3, #01-508, Singapore 460537",
    phone: "+6562430011",
    hours: "Mon–Fri 9am–5.30pm",
    services: ["home safety assessment", "adaptive equipment", "confidence building", "floor transfer training"],
  },
  {
    id: "clinic-tampines-physio",
    name: "Tampines Physio & Sports",
    type: "physiotherapy",
    area: "Tampines",
    address: "501 Tampines Ave 9, #01-66, Singapore 520501",
    phone: "+6562430012",
    hours: "Mon–Fri 9am–7pm, Sat 9am–1pm",
    services: ["falls assessment", "gait rehab", "balance training", "strength conditioning"],
  },
];
