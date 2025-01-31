// lib/auth.ts

import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  UserCredential
} from 'firebase/auth';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';

/**
 * Sign in with Google (popup flow).
 * After sign-in, we create/update a doc in /users/{uid}.
 */
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  await createOrUpdateUserDoc(result);
  return result.user;
}

/**
 * (Optional) Sign in with email & password.
 * After sign-in, we create/update a doc in /users/{uid}.
 */
export async function signInWithEmail(email: string, password: string) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  await createOrUpdateUserDoc(result);
  return result.user;
}

/**
 * (Optional) Create a user account with email & password.
 * After sign-up, we create the doc in /users/{uid}.
 */
export async function signUpWithEmail(email: string, password: string) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await createOrUpdateUserDoc(result);
  return result.user;
}

/**
 * (Optional) Sign in anonymously, then create a doc in /users/{uid}.
 */
export async function signInAnonymouslyAndSetDoc() {
  const result = await signInAnonymously(auth);
  await createOrUpdateUserDoc(result);
  return result.user;
}

/**
 * Sign out the current user.
 */
export async function signOut() {
  await firebaseSignOut(auth);
}

/**
 * Private helper to create/update the user doc in Firestore.
 * Called after any sign-in method (Google, email, anonymous, etc.).
 */
async function createOrUpdateUserDoc(result: UserCredential) {
  const user = result.user;
  // user.displayName might be null if using email/password and not set
  // user.email might be null if anonymous
  await setDoc(
    doc(db, 'users', user.uid),
    {
      email: user.email || null,
      displayName: user.displayName || null,
      photoURL: user.photoURL || null,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
