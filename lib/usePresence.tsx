"use client";

import { useEffect } from "react";
import { getFirestore, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { app } from "./firebaseConfig";
import { useAuth } from "@/lib/context/AuthContext";

export function usePresence() {
  const { user } = useAuth();
  const db = getFirestore(app);

  useEffect(() => {
    if (!user) return;

    const updateStatus = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          // Set status to "online" and update lastActive with server time.
          status: "online",
          lastActive: serverTimestamp(),
        });
      } catch (err) {
        console.error("Error updating presence:", err);
      }
    };

    // Update on window focus.
    window.addEventListener("focus", updateStatus);

    // Update on common activity events.
    const activityEvents = ["mousemove", "keydown", "scroll", "touchstart"];
    activityEvents.forEach((event) =>
      window.addEventListener(event, updateStatus)
    );

    // Also set a heartbeat interval (e.g., every 60 seconds).
    const intervalId = setInterval(updateStatus, 60000);

    // Initial status update.
    updateStatus();

    return () => {
      window.removeEventListener("focus", updateStatus);
      activityEvents.forEach((event) =>
        window.removeEventListener(event, updateStatus)
      );
      clearInterval(intervalId);
    };
  }, [user, db]);
}
