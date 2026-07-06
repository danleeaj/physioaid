import {
  collection,
  doc,
  getDoc,
  setDoc,
  query,
  where,
  getDocs,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type CarePartnerInvite = {
  code: string;
  ownerUid: string;
  ownerName: string;
  ownerPhone: string;
  latestSummary: InviteSummary | null;
  createdAt: string;
  updatedAt: string;
};

export type InviteSummary = {
  date: string;
  riskCategory: string | null;
  completedTests: string[];
  overallScore: string | null;
};

function invitesRef() {
  return collection(db, "carePartnerInvites");
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createInvite(
  ownerUid: string,
  ownerName: string,
  ownerPhone: string,
): Promise<CarePartnerInvite> {
  const existing = await getInviteByOwner(ownerUid);
  if (existing) return existing;

  const code = generateCode();
  const now = new Date().toISOString();
  const invite: CarePartnerInvite = {
    code,
    ownerUid,
    ownerName,
    ownerPhone,
    latestSummary: null,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(doc(invitesRef(), code), invite);
  return invite;
}

export async function getInviteByCode(
  code: string,
): Promise<CarePartnerInvite | null> {
  const snap = await getDoc(doc(invitesRef(), code.toUpperCase().trim()));
  if (!snap.exists()) return null;
  return snap.data() as CarePartnerInvite;
}

export async function getInviteByOwner(
  ownerUid: string,
): Promise<CarePartnerInvite | null> {
  const q = query(
    invitesRef(),
    where("ownerUid", "==", ownerUid),
    limit(1),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data() as CarePartnerInvite;
}

export async function updateInviteSummary(
  code: string,
  summary: InviteSummary,
): Promise<void> {
  await setDoc(
    doc(invitesRef(), code),
    { latestSummary: summary, updatedAt: new Date().toISOString() },
    { merge: true },
  );
}

export function buildWhatsAppLink(code: string, ownerName: string): string {
  const message = `Hi, ${ownerName} has invited you to view their PhysioAid mobility check results. Use this invite code to access their summaries:\n\nInvite code: ${code}\n\nOpen PhysioAid and tap "Care partner sign in" to enter the code.`;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
