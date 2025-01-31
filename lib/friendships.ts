import { db } from './firebaseConfig';
import {
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { findUserByUid } from './users';

/**
 * Internal helper:
 * Sort two UIDs so user1 < user2 in lexical order.
 */
function sortUIDs(uidA: string, uidB: string): [string, string] {
  return uidA < uidB ? [uidA, uidB] : [uidB, uidA];
}

/**
 * Send a friend request to another user.
 * Creates or updates the doc in "friendships".
 * "status" becomes "pending", "requestedBy" is currentUid.
 */
export async function sendFriendRequest(currentUid: string, otherUid: string) {
  const [user1, user2] = sortUIDs(currentUid, otherUid);
  const docId = `${user1}_${user2}`;
  const docRef = doc(db, 'friendships', docId);

  await setDoc(docRef, {
    user1,
    user2,
    status: 'pending',
    requestedBy: currentUid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

/**
 * Accept a friend request.
 * If the doc status is "pending", we set it to "accepted".
 */
export async function acceptFriendRequest(currentUid: string, otherUid: string) {
  const [user1, user2] = sortUIDs(currentUid, otherUid);
  const docId = `${user1}_${user2}`;
  const docRef = doc(db, 'friendships', docId);

  await updateDoc(docRef, {
    status: 'accepted',
    updatedAt: serverTimestamp()
  });
}

/**
 * Remove or reject a friend request.
 * Could set status="removed" or "blocked", or just delete doc.
 */
export async function removeFriend(currentUid: string, otherUid: string) {
  const [user1, user2] = sortUIDs(currentUid, otherUid);
  const docId = `${user1}_${user2}`;
  const docRef = doc(db, 'friendships', docId);

  await updateDoc(docRef, {
    status: 'removed',
    updatedAt: serverTimestamp(),
  });
}

/**
 * Query all current "accepted" friends of currentUid.
 */
export async function getAcceptedFriends(currentUid: string) {
  const friendsRef = collection(db, 'friendships');

  const q1 = query(friendsRef, where('user1', '==', currentUid), where('status', '==', 'accepted'));
  const snap1 = await getDocs(q1);

  const q2 = query(friendsRef, where('user2', '==', currentUid), where('status', '==', 'accepted'));
  const snap2 = await getDocs(q2);

  const friendUIDs: string[] = [];
  snap1.forEach((doc) => {
    const data = doc.data();
    friendUIDs.push(data.user2);
  });

  snap2.forEach((doc) => {
    const data = doc.data();
    friendUIDs.push(data.user1);
  });

  const friends = await Promise.all(friendUIDs.map(uid => findUserByUid(uid)));
  return friends;
}

/**
 * Get pending friend requests for currentUid.
 */
export async function getPendingRequests(currentUid: string) {
  const friendsRef = collection(db, 'friendships');
  const q = query(
    friendsRef,
    where('user2', '==', currentUid),
    where('status', '==', 'pending')
  );
  const snap = await getDocs(q);

  const requests = await Promise.all(snap.docs.map(async (doc) => {
    const data = doc.data();
    const user = await findUserByUid(data.user1);
    return { ...data, user };
  }));

  return requests;
}