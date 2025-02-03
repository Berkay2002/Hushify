import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  UserCredential,
  getAuth
} from 'firebase/auth';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';

/**
 * Sign in with Google (popup flow).
 * After sign-in, we create/update a doc in /users/{uid}.
 */
export async function signInWithGoogle() {
  const auth = getAuth();
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
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
 * Called after a successful Google sign-in.
 */
async function createOrUpdateUserDoc(result: UserCredential) {
  const user = result.user;
  await setDoc(
    doc(db, 'users', user.uid),
    {
      email: user.email || null,
      displayName: user.displayName || null,
      photoURL: user.photoURL || null,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}