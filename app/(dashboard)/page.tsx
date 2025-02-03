"use client";

import { useAuth } from "@/lib/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { OnlineCard } from "@/components/ui/onlineCards";
import { db } from "@/lib/firebaseConfig"; 
import { collection, onSnapshot } from "firebase/firestore";
import { getAcceptedFriends } from "@/lib/friendships";
import type { User } from "@/lib/interfaces";

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [onlineFriends, setOnlineFriends] = useState<User[]>([]);

  useEffect(() => {
    if (!user) return;

    async function subscribeOnlineFriends() {
      // Get accepted friends for current user.
      if (!user) return;
      const acceptedFriends = await getAcceptedFriends(user.uid);
      const acceptedFriendIds = acceptedFriends.map(friend => friend.uid);

      const usersRef = collection(db, "users");
      const unsubscribe = onSnapshot(usersRef, (snapshot) => {
        const now = Date.now();
        const onlineThreshold = 5 * 60 * 1000; // 5 minutes in milliseconds
      
        const friendsList: User[] = snapshot.docs
          .map((doc) => {
            const data = doc.data();
            const lastActive = data.lastActive ? data.lastActive.toDate().getTime() : 0;
            const isOnline = now - lastActive < onlineThreshold;
            return {
              uid: doc.id,
              email: data.email,
              username: data.username || data.displayName || data.email,
              displayName: data.displayName,
              photoURL: data.photoURL,
              status: isOnline ? "online" : "offline",
            } as User;
          })
          // Only include accepted friends who are online.
          .filter((u) => acceptedFriendIds.includes(u.uid) && u.status === "online");

        setOnlineFriends(friendsList);
      });

      return unsubscribe;
    }

    const unsubscribePromise = subscribeOnlineFriends();
    return () => {
      unsubscribePromise.then(unsubscribe => {
        if (unsubscribe) unsubscribe();
      });
    };
  }, [user]);

  const handleLoginRedirect = () => {
    router.push("/login");
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
      </div>

      {/* Login Button if User is Not Logged In */}
      {!user && (
        <Button onClick={handleLoginRedirect} className="mt-4">
          Login
        </Button>
      )}

      {/* Online Friends List */}
      <div className="p-4 rounded-lg max-w-md h-[88vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-white mb-2">Online Friends</h2>
        <div className="space-y-2">
          {onlineFriends.map((friend) => (
            <OnlineCard key={friend.uid} user={friend} conversationId={friend.conversationIds?.[0] || ''} />
          ))}
        </div>
      </div>
    </div>
  );
}