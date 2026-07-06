export function buildWhatsAppLink(phone: string, ownerName: string): string {
  const name = ownerName.trim() || "Someone";
  const message = `Hi, ${name} would like to share their PhysioAid mobility check results with you. Open PhysioAid and tap "Care partner sign in" to get started.`;
  return `https://wa.me/${encodeURIComponent(phone)}?text=${encodeURIComponent(message)}`;
}
