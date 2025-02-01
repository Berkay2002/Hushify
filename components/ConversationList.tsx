"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { getConversationsWithFriendData } from "@/lib/chatHelpers";
import { ConversationCard } from "./ui/conversationCards";
import { Conversation, User } from "@/app/interfaces";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ConversationList() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<(Conversation & { friend?: User })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      try {
        const convos = await getConversationsWithFriendData(user.uid);
        setConversations(convos);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (!user) {
    return <div className="p-4">Please sign in.</div>;
  }
  if (loading) {
    return <div className="p-4">Loading chats...</div>;
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-semibold">All Chats</h2>
        <Link href="/chats/new">
          <Button className="rounded-full" variant="outline">New Chat</Button>
        </Link>
      </div>

      {conversations.length === 0 ? (
        <p>No conversations yet.</p>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => (
            <ConversationCard
              key={conv.id}
              conversation={conv}
              className="rounded-full mx-2"
            />
          ))}
        </div>
      )}
    </div>
  );
}
