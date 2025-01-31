import { db } from '@/lib/firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Conversation, User } from '@/app/interfaces';
import { findUserByUid } from '@/lib/users'; // or define a small helper here

/**
 * Return all "one-on-one" conversations for currentUid,
 * plus the friend data (username, photoURL, etc.) attached
 * so we can display it easily in the UI.
 */
export async function getConversationsWithFriendData(currentUid: string): Promise<(Conversation & { friend?: User })[]> {
  const convRef = collection(db, 'conversations');
  const q = query(convRef, where('participants', 'array-contains', currentUid));
  const snap = await getDocs(q);

  // Convert doc -> conversation
  const rawConversations: Conversation[] = snap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as Conversation[];

  // We only want 1-on-1 convos for a single friend, so filter or assume .length === 2
  const oneOnOne = rawConversations.filter(
    (c) => c.participants && c.participants.length === 2
  );

  // For each conversation, figure out which participant is NOT the current user,
  // then fetch that user's profile so we can display their name/photo.
  const result: (Conversation & { friend?: User })[] = [];

  for (const convo of oneOnOne) {
    const friendUid = convo.participants!.find((p) => p !== currentUid);
    if (!friendUid) {
      // Means participants array didn't have a second user, skip
      result.push(convo);
      continue;
    }

    const friend = await findUserByUid(friendUid);
    // Attach friend as a new property
    result.push({ ...convo, friend });
  }

  return result;
}
