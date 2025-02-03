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
 * Added a "participants" field to enable a single query for friend lists.
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
      participants: [user1, user2],
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
 * Optimized query by using the "participants" array field.
 */
export async function getAcceptedFriends(currentUid: string): Promise<User[]> {
  const friendsRef = collection(db, 'friendships');
  const q = query(
    friendsRef,
    where('participants', 'array-contains', currentUid),
    where('status', '==', 'accepted')
  );
  const snap = await getDocs(q);

  const friendUIDs: string[] = [];
  snap.forEach((doc) => {
    const data = doc.data();
    // Identify the friend uid (the one that is not the current user)
    const friendUid = data.participants.find((uid: string) => uid !== currentUid);
    if (friendUid) friendUIDs.push(friendUid);
  });

  const friends = await Promise.all(friendUIDs.map(uid => findUserByUid(uid)));
  return friends.filter(Boolean) as User[];
}

/**
 * Get pending friend requests for currentUid.
 * Returns only pending requests where the current user did not send the request.
 * Optimized by using the "participants" array.
 */
export async function getPendingRequests(currentUid: string) {
  const friendsRef = collection(db, 'friendships');
  const q = query(
    friendsRef,
    where('participants', 'array-contains', currentUid),
    where('status', '==', 'pending')
  );
  const snap = await getDocs(q);
  const allDocs = snap.docs;

  const requests = await Promise.all(
    allDocs.map(async (doc) => {
      const data = doc.data();
      if (data.requestedBy === currentUid) return null;
      const friendUid = data.participants.find((uid: string) => uid !== currentUid);
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