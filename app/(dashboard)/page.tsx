"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/lib/context/AuthContext";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

import { getConversationsWithFriendData } from "@/lib/chatHelpers";
import { ConversationCard } from "@/components/ui/conversationCards";  // <--- import here!
import { Conversation, User } from "@/app/interfaces";

export default function ProductsPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<(Conversation & { friend?: User })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    (async () => {
      setLoading(true);
      try {
        // Suppose this helper returns an array of Conversation objects,
        // each with a "friend" field already resolved
        const convos = await getConversationsWithFriendData(user.uid);
        setConversations(convos);
      } catch (err) {
        console.error("Error fetching conversations:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (!user) {
    return (
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>Please Sign In</CardTitle>
            <CardDescription>
              You need to be signed in to view your chats.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 flex justify-center items-center">
        <p className="text-sm text-muted-foreground">Loading chats...</p>
      </div>
    );
  }

  return (
    <Tabs defaultValue="all">
      <div className="flex items-center mb-4">
        <TabsList>
          <TabsTrigger value="all">All Chats</TabsTrigger>
          <TabsTrigger value="new">New Chat</TabsTrigger>
        </TabsList>
      </div>

      {/* All existing chats */}
      <TabsContent value="all">
        {conversations.length === 0 ? (
          <p>No conversations yet.</p>
        ) : (
          <div className="space-y-2">
            {/* Instead of building the card inline, use ConversationCard */}
            {conversations.map((c) => (
              <ConversationCard
                key={c.id}
                conversation={c}
                currentUserUid={user.uid}
              />
            ))}
          </div>
        )}
      </TabsContent>

      {/* Start a new chat */}
      <TabsContent value="new">
        <Card>
          <CardHeader>
            <CardTitle>Start a New Conversation</CardTitle>
            <CardDescription>
              Create a chat with an existing friend or group.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/chat/new">
              <Button>Create New Conversation</Button>
            </Link>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
