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
import { normalizeSession } from "@/lib/assessment/normalize-session";
import type { AssessmentSession } from "@/types/assessment";

function assessmentsRef(uid: string) {
  return collection(db, "users", uid, "assessments");
}

/**
 * Firestore rejects `undefined` values outright — v2 sessions legitimately
 * omit skipped tests, so drop undefined keys (recursively) before writing.
 */
function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as unknown as T;
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, stripUndefined(v)]),
    ) as T;
  }
  return value;
}

export async function saveAssessment(
  uid: string,
  session: AssessmentSession,
): Promise<void> {
  await setDoc(
    doc(assessmentsRef(uid), session.id),
    stripUndefined({
      ...session,
      userId: uid,
    }),
  );
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
  return normalizeSession(snap.data());
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
  return snap.docs
    .map((d) => normalizeSession(d.data()))
    .filter((session): session is AssessmentSession => session !== null);
}
