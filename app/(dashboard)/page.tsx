"use client";

import { useAuth } from "@/lib/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { OnlineCard } from "@/components/ui/onlineCards";
import { db } from "@/lib/firebaseConfig"; 
import { collection, onSnapshot } from "firebase/firestore";
import type { User } from "@/lib/interfaces";

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);

  useEffect(() => {
    const usersRef = collection(db, "users");
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const usersList: User[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        // Define an online threshold (e.g., 5 minutes)
        const onlineThreshold = 5 * 60 * 1000; // 5 minutes in milliseconds
        // Convert Firestore Timestamp to milliseconds
        const lastActive = data.lastActive ? data.lastActive.toDate().getTime() : 0;
        const isOnline = Date.now() - lastActive < onlineThreshold;

        return {
          uid: doc.id,
          email: data.email,
          // Use displayName if username is missing.
          username: data.username || data.displayName || data.email,
          displayName: data.displayName,
          photoURL: data.photoURL,
          status: isOnline ? "online" : "offline",
        } as User;
      })
      // Filter to only include users that are online and are not the current user.
      .filter((u) => u.status === "online" && u.uid !== user?.uid);

      setOnlineUsers(usersList);
    });

    return () => unsubscribe();
  }, [user]);
  

  const handleLoginRedirect = () => {
    router.push("/login");
  };

  return (
    <div className="p-4 space-y-6 ">
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

      {/* Online Users List */}
      <div className=" p-4 rounded-lg max-w-md h-[88vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-white mb-2">Online Friends</h2>
        <div className="space-y-2">
          {onlineUsers.map((user) => (
            <OnlineCard key={user.uid} user={user} />
          ))}
        </div>
      </div>
    </div>
  );
}
