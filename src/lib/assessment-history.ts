import {
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { AssessmentSession } from "@/types/assessment";

function assessmentsRef(uid: string) {
  return collection(db, "users", uid, "assessments");
}

export async function saveAssessment(
  uid: string,
  session: AssessmentSession,
): Promise<void> {
  await setDoc(doc(assessmentsRef(uid), session.id), {
    ...session,
    userId: uid,
  });
}

/** Single-doc lookup used by the report page to resolve a Firestore-backed session. */
export async function getAssessment(
  uid: string,
  id: string,
): Promise<AssessmentSession | null> {
  const snap = await getDoc(doc(assessmentsRef(uid), id));
  if (!snap.exists()) {
    return null;
  }
  return snap.data() as AssessmentSession;
}

export async function getAssessmentHistory(
  uid: string,
  max = 20,
): Promise<AssessmentSession[]> {
  const q = query(
    assessmentsRef(uid),
    orderBy("createdAt", "desc"),
    limit(max),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as AssessmentSession);
}
