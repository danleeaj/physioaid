import {
  collection,
  doc,
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
  await setDoc(doc(assessmentsRef(uid), session.id), session);
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
