// /lib/users.ts
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import type { User } from '@/lib/interfaces';

/**
 * Find a user by exact email.
 * This function ensures that the returned object always has an `email` property.
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const usersRef = collection(db, 'users');
  const emailQ = query(usersRef, where('email', '==', email));
  const emailSnap = await getDocs(emailQ);
  if (!emailSnap.empty) {
    const docSnap = emailSnap.docs[0];
    const data = docSnap.data();
    // Use the searched email as a fallback if data.email is missing.
    return { uid: docSnap.id, email, ...data } as User;
  }
  return null;
}

/**
 * Find a user by exact email or username (whichever field is provided).
 * If neither is found, return null.
 */
export async function findUserByEmailOrUsername(term: string): Promise<User | null> {
  const usersRef = collection(db, 'users');

  const emailQ = query(usersRef, where('email', '==', term));
  const usernameQ = query(usersRef, where('username', '==', term));

  const [emailSnap, usernameSnap] = await Promise.all([
    getDocs(emailQ),
    getDocs(usernameQ),
  ]);

  if (!emailSnap.empty) {
    const docSnap = emailSnap.docs[0];
    const data = docSnap.data();
    return { uid: docSnap.id, email: data.email ?? term, ...data } as User;
  }

  if (!usernameSnap.empty) {
    const docSnap = usernameSnap.docs[0];
    const data = docSnap.data();
    return { uid: docSnap.id, email: data.email ?? term, ...data } as User;
  }

  return null;
}

/**
 * Find a user by UID.
 */
export async function findUserByUid(uid: string): Promise<User | null> {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    return { uid: docSnap.id, email: data.email, ...data } as User;
  }
  return null;
}
