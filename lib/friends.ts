import { db } from './firebaseConfig';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';

export async function addFriend(userId: string, friendId: string) {
  await addDoc(collection(db, 'friends'), {
    userId,
    friendId,
  });
}

export async function getFriends(userId: string) {
  const q = query(collection(db, 'friends'), where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  const friends = querySnapshot.docs.map(doc => doc.data().friendId);
  return friends;
}