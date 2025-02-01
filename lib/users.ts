// /lib/users.ts
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

/**
 * Find a user by exact email.
 */
export async function getUserByEmail(email: string) {
  const usersRef = collection(db, 'users');
  const emailQ = query(usersRef, where('email', '==', email));
  const emailSnap = await getDocs(emailQ);
  if (!emailSnap.empty) {
    const docSnap = emailSnap.docs[0];
    return { uid: docSnap.id, ...docSnap.data() };
  }
  return null;
}

/**
 * Find a user by exact email or username (whichever field is provided).
 * If neither is found, return null.
 */
export async function findUserByEmailOrUsername(term: string) {
  const usersRef = collection(db, 'users');

  const emailQ = query(usersRef, where('email', '==', term));
  const usernameQ = query(usersRef, where('username', '==', term));

  const [emailSnap, usernameSnap] = await Promise.all([
    getDocs(emailQ),
    getDocs(usernameQ),
  ]);

  if (!emailSnap.empty) {
    const docSnap = emailSnap.docs[0];
    return { uid: docSnap.id, ...docSnap.data() };
  }

  if (!usernameSnap.empty) {
    const docSnap = usernameSnap.docs[0];
    return { uid: docSnap.id, ...docSnap.data() };
  }

  return null;
}

/**
 * Find a user by UID.
 */
export async function findUserByUid(uid: string) {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { uid: docSnap.id, ...docSnap.data() };
  }

  return null;
}
