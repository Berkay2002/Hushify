// /lib/friendships.ts
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
  getDoc,
} from 'firebase/firestore';
import { findUserByUid } from './users';
import type { Conversation, User } from '@/lib/interfaces';

/**
 * Internal helper:
 * Sort two UIDs so user1 < user2 in lexical order.
 */
function sortUIDs(uidA: string, uidB: string): [string, string] {
  return uidA < uidB ? [uidA, uidB] : [uidB, uidA];
}

/**
 * Send a friend request to another user.
 */
export async function sendFriendRequest(currentUid: string, otherUid: string) {
  const [user1, user2] = sortUIDs(currentUid, otherUid);
  const docId = `${user1}_${user2}`;
  const docRef = doc(db, 'friendships', docId);

  await setDoc(
    docRef,
    {
      user1,
      user2,
      status: 'pending',
      requestedBy: currentUid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Accept a friend request.
 */
export async function acceptFriendRequest(currentUid: string, otherUid: string) {
  const [user1, user2] = sortUIDs(currentUid, otherUid);
  const docId = `${user1}_${user2}`;
  const docRef = doc(db, 'friendships', docId);

  await updateDoc(docRef, {
    status: 'accepted',
    updatedAt: serverTimestamp(),
  });
}

/**
 * Remove or reject a friend request.
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
 * Returns an array of User objects.
 */
export async function getAcceptedFriends(currentUid: string): Promise<User[]> {
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

  // Retrieve user objects for all friendUIDs.
  const friends = await Promise.all(friendUIDs.map(uid => findUserByUid(uid)));
  // Filter out any null values and cast to User[]
  return friends.filter(Boolean) as User[];
}

/**
 * Get pending friend requests for currentUid.
 * Returns only pending requests where the authenticated user is a participant but did not send the request.
 */
export async function getPendingRequests(currentUid: string) {
  const friendsRef = collection(db, 'friendships');
  
  // Query for pending requests where current user is in user1
  const q1 = query(
    friendsRef,
    where('user1', '==', currentUid),
    where('status', '==', 'pending')
  );
  // Query for pending requests where current user is in user2
  const q2 = query(
    friendsRef,
    where('user2', '==', currentUid),
    where('status', '==', 'pending')
  );
  
  const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
  const allDocs = [...snap1.docs, ...snap2.docs];

  const requests = await Promise.all(
    allDocs.map(async (doc) => {
      const data = doc.data();
      // Exclude if the current user is the one who requested (i.e. sent the friend request)
      if (data.requestedBy === currentUid) return null;
      // Determine the other user's UID.
      const friendUid = data.user1 === currentUid ? data.user2 : data.user1;
      const user = await findUserByUid(friendUid);
      return { ...data, user };
    })
  );
  return requests.filter(Boolean);
}

/**
 * Fetch a single conversation (by conversationId) and augment it with friend data.
 */
export async function getConversationWithFriendData(
  conversationId: string,
  currentUserUid: string
): Promise<(Conversation & { friend?: User }) | null> {
  const conversationRef = doc(db, 'conversations', conversationId);
  const snap = await getDoc(conversationRef);
  if (!snap.exists()) {
    return null;
  }
  const conversationData = snap.data() as Conversation;

  // If not one-on-one, return as is.
  if (!conversationData.participants || conversationData.participants.length !== 2) {
    return conversationData;
  }

  const friendUid = conversationData.participants.find((uid) => uid !== currentUserUid);
  if (!friendUid) {
    return conversationData;
  }

  const friend = (await findUserByUid(friendUid)) ?? undefined;
  return { ...conversationData, friend };
}
