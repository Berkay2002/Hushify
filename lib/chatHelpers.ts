// /lib/chatHelpers.ts
import { db } from '@/lib/firebaseConfig';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { Conversation, User } from '@/app/interfaces';
import { findUserByUid } from '@/lib/users';

/**
 * Return all one-on-one conversations for currentUid,
 * with the friend data (username, photoURL, etc.) attached.
 */
export async function getConversationsWithFriendData(currentUid: string): Promise<(Conversation & { friend?: User })[]> {
  const convRef = collection(db, 'conversations');
  const q = query(convRef, where('participants', 'array-contains', currentUid));
  const snap = await getDocs(q);

  // Convert each document into a Conversation object
  const rawConversations: Conversation[] = snap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as Conversation[];

  // Filter for one-on-one conversations (assumes exactly 2 participants)
  const oneOnOne = rawConversations.filter(
    (c) => c.participants && c.participants.length === 2
  );

  const result: (Conversation & { friend?: User })[] = [];

  // For each conversation, determine which participant is the friend and fetch their data
  for (const convo of oneOnOne) {
    const friendUid = convo.participants!.find((p) => p !== currentUid);
    if (!friendUid) {
      result.push(convo);
      continue;
    }
    const friend = await findUserByUid(friendUid);
    result.push({ ...convo, friend });
  }

  return result;
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

  // Fetch the friend's details
  const friend = await findUserByUid(friendUid);
  return { ...conversationData, friend };
}
