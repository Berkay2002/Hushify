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
 * Creates or updates the doc in "friendships".
 * "status" becomes "pending", "requestedBy" is currentUid.
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
 * If the doc status is "pending", we set it to "accepted".
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
 * Could set status="removed" or "blocked", or just update the doc.
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
export async function getAcceptedFriends(currentUid: string): Promise<(Conversation & { friend?: User })[]> {
  const friendsRef = collection(db, 'friendships');

  const q1 = query(
    friendsRef,
    where('user1', '==', currentUid),
    where('status', '==', 'accepted')
  );
  const snap1 = await getDocs(q1);

  const q2 = query(
    friendsRef,
    where('user2', '==', currentUid),
    where('status', '==', 'accepted')
  );
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
  return friends.filter(Boolean) as (Conversation & { friend?: User })[];
}

/**
 * Get pending friend requests for currentUid.
 * This function returns only pending requests where:
 * - The current user is a participant (either as user1 or user2), AND
 * - The current user did NOT send the request (i.e. requestedBy !== currentUid).
 */
export async function getPendingRequests(currentUid: string) {
  const friendsRef = collection(db, 'friendships');
  
  // Query for pending requests where the current user is in user1
  const q1 = query(
    friendsRef,
    where('user1', '==', currentUid),
    where('status', '==', 'pending')
  );
  // Query for pending requests where the current user is in user2
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
      // Exclude if the current user is the one who requested (i.e., sent the friend request)
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
 * It assumes the conversation is a one-on-one conversation.
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

  // If the conversation isn’t one-on-one, just return it.
  if (!conversationData.participants || conversationData.participants.length !== 2) {
    return conversationData;
  }

  // Determine which UID is the friend (not the current user)
  const friendUid = conversationData.participants.find((uid) => uid !== currentUserUid);
  if (!friendUid) {
    return conversationData;
  }

  // Fetch the friend's details; convert null to undefined if necessary.
  const friend = (await findUserByUid(friendUid)) ?? undefined;
  return { ...conversationData, friend };
}
