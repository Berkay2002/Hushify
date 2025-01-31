import { db } from './firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';

export async function searchUsers(term: string) {
  const usersRef = collection(db, 'users');
  // exact match query for "username"
  const q = query(usersRef, where('username', '==', term));
  const snap = await getDocs(q);

  return snap.docs.map(doc => ({
    uid: doc.id,
    ...doc.data(),
  }));
}
