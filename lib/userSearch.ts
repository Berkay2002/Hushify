// lib/userSearch.ts
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import type { User } from "@/lib/interfaces";

/**
 * Searches for users where the term matches either username or email.
 * Returns an array of User objects. If a field is missing, we fallback
 * to an empty string for email.
 */
export async function searchUsers(term: string): Promise<User[]> {
  const usersRef = collection(db, "users");

  // Firestore doesn't support OR queries directly.
  // We'll perform two queries (one for username, one for email) and merge the results.
  const qUsername = query(
    usersRef,
    where("username", ">=", term),
    where("username", "<=", term + "\uf8ff")
  );
  const qEmail = query(
    usersRef,
    where("email", ">=", term),
    where("email", "<=", term + "\uf8ff")
  );

  const [usernameSnap, emailSnap] = await Promise.all([
    getDocs(qUsername),
    getDocs(qEmail)
  ]);

  const resultsMap: Record<string, User> = {};

  usernameSnap.docs.forEach((docSnap) => {
    const data = docSnap.data();
    // Ensure we have an email property (fallback to empty string if not provided)
    resultsMap[docSnap.id] = { uid: docSnap.id, email: data.email ?? "", ...data } as User;
  });

  emailSnap.docs.forEach((docSnap) => {
    const data = docSnap.data();
    resultsMap[docSnap.id] = { uid: docSnap.id, email: data.email ?? "", ...data } as User;
  });

  return Object.values(resultsMap);
}
