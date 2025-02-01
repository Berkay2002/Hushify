// app/(dashboard)/chats/new/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { useAuth } from "@/lib/context/AuthContext";
import { createConversation } from "@/lib/messenger";
import { getAcceptedFriends } from "@/lib/friendships";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { Conversation, User } from "@/app/interfaces";

/**
 * Return any existing conversation (with exactly 2 participants)
 * between userUid and friendUid. If none, returns null.
 */
async function findOneOnOneConversation(userUid: string, friendUid: string): Promise<Conversation | null> {
  const convRef = collection(db, "conversations");
  // Query where "participants" array-contains userUid
  const q = query(convRef, where("participants", "array-contains", userUid));
  const snap = await getDocs(q);

  // Filter for exactly 2 participants, and must include friendUid
  for (const docSnap of snap.docs) {
    const data = docSnap.data() as Conversation;
    if (
      data.participants &&
      data.participants.length === 2 &&
      data.participants.includes(friendUid)
    ) {
      return {
        id: docSnap.id,
        ...data
      };
    }
  }
  return null;
}

/**
 * Optionally, you can also unify both a "getMyOneOnOneConversations" function
 * and this approach. The key is to detect if (participants == [user, friend]) already.
 */

export default function NewConversationPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [friends, setFriends] = useState<User[]>([]);
  const [selectedFriend, setSelectedFriend] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      try {
        // 1) Get accepted friends
        const myFriends = await getAcceptedFriends(user.uid);
        setFriends(myFriends.filter(Boolean) as User[]);
      } catch (err) {
        console.error("Error loading friends:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  async function handleCreate() {
    if (!selectedFriend || !user) return;
    try {
      // 1) Check if there's already a 1-on-1 conversation
      const existing = await findOneOnOneConversation(user.uid, selectedFriend);
      if (existing) {
        // If found, redirect user to that conversation
        alert("You already have a conversation with this friend. Redirecting...");
        router.push(`/chat/${existing.id}`);
        return;
      }

      // 2) If no existing convo, create a new one
      const conversationId = await createConversation([user.uid, selectedFriend]);
      router.push(`/chat/${conversationId}`);
    } catch (err) {
      console.error("Error creating conversation:", err);
    }
  }

  if (!user) {
    return (
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>Please Sign In</CardTitle>
            <CardDescription>You need to be signed in to create a chat.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 flex justify-center items-center">
        <p className="text-sm text-muted-foreground">Loading friends...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex justify-center items-start md:items-center p-8 bg-black text-white">
      <Card className="w-full max-w-md bg-gray-800 text-white">
        <CardHeader>
          <CardTitle className="text-2xl">Start a New Conversation</CardTitle>
          <CardDescription>Select a friend to start a conversation with</CardDescription>
        </CardHeader>
        <CardContent>
          <select
            className="w-full p-2 border rounded bg-gray-700 text-white"
            value={selectedFriend}
            onChange={(e) => setSelectedFriend(e.target.value)}
          >
            <option value="" disabled>-- Select --</option>
            {friends.map((friend) => (
              <option key={friend.uid} value={friend.uid}>
                {friend.username || friend.displayName || friend.email}
              </option>
            ))}
          </select>
        </CardContent>
        <CardFooter>
          <Button onClick={handleCreate} className="w-full bg-white text-black hover:bg-gray-200">
            Create Conversation
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
