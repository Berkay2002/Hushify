import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  query, 
  where, 
  getDocs, 
  DocumentData 
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import { User } from "@/lib/interfaces"; 

export const sendFriendRequest = async (currentUid: string, otherUid: string): Promise<void> => {
  const [user1, user2] = [currentUid, otherUid].sort();
  const docId = `${user1}_${user2}`;
  const docRef = doc(db, "friendships", docId);

  await setDoc(docRef, {
    user1,
    user2,
    participants: [user1, user2],
    status: "pending",
    requestedBy: currentUid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
};

export const acceptFriendRequest = async (currentUid: string, otherUid: string): Promise<void> => {
  const [user1, user2] = [currentUid, otherUid].sort();
  const docId = `${user1}_${user2}`;
  const docRef = doc(db, "friendships", docId);

  await updateDoc(docRef, {
    status: "accepted",
    updatedAt: serverTimestamp(),
  });
};

export const removeFriend = async (currentUid: string, otherUid: string): Promise<void> => {
  const [user1, user2] = [currentUid, otherUid].sort();
  const docId = `${user1}_${user2}`;
  const docRef = doc(db, "friendships", docId);

  await updateDoc(docRef, {
    status: "removed",
    updatedAt: serverTimestamp(),
  });
};

export const getAcceptedFriends = async (currentUid: string): Promise<User[]> => {
  const friendsRef = collection(db, "friendships");
  const q = query(
    friendsRef,
    where("participants", "array-contains", currentUid),
    where("status", "==", "accepted")
  );

  const snap = await getDocs(q);

  interface FriendshipDoc {
    participants: string[];
  }

  const friendUIDs: string[] = snap.docs
    .map((doc) => {
      const data = doc.data() as FriendshipDoc;
      return data.participants.find(uid => uid !== currentUid) ?? "";
    })
    .filter(uid => uid !== ""); // Removes any undefined values

  if (friendUIDs.length === 0) return [];

  const usersCollection = collection(db, "users");
  const userDocs: DocumentData[] = [];

  for (let i = 0; i < friendUIDs.length; i += 10) {
    const batchUIDs = friendUIDs.slice(i, i + 10);
    const usersQuery = query(usersCollection, where("__name__", "in", batchUIDs));
    const usersSnap = await getDocs(usersQuery);
    userDocs.push(...usersSnap.docs);
  }

  return userDocs.map(doc => {
    const userData = doc.data() as User;
    return {
      id: doc.id, // Ensuring document ID is assigned properly
      ...userData
    };
  });
};

export const getPendingRequests = async (currentUid: string): Promise<User[]> => {
  const friendsRef = collection(db, "friendships");
  const q = query(
    friendsRef,
    where("participants", "array-contains", currentUid),
    where("status", "==", "pending")
  );

  const snap = await getDocs(q);
  const allDocs = snap.docs;

  const friendUIDs: string[] = allDocs
    .map((doc) => {
      const data = doc.data();
      return data.requestedBy !== currentUid
        ? data.participants.find((uid: string) => uid !== currentUid) ?? ""
        : "";
    })
    .filter(uid => uid !== ""); // Remove empty values

  if (friendUIDs.length === 0) return [];

  const usersCollection = collection(db, "users");
  const userDocs: DocumentData[] = [];

  for (let i = 0; i < friendUIDs.length; i += 10) {
    const batchUIDs = friendUIDs.slice(i, i + 10);
    const usersQuery = query(usersCollection, where("__name__", "in", batchUIDs));
    const usersSnap = await getDocs(usersQuery);
    userDocs.push(...usersSnap.docs);
  }

  return userDocs.map(doc => ({
    id: doc.id,
    ...(doc.data() as User)
  }));
};


