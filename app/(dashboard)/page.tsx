"use client";

import { useAuth } from "@/lib/context/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const handleLoginRedirect = () => {
    router.push("/login");
  };

  return (
    <div className="p-4">
      <h1>Dashboard</h1>
      <p>Some stats or overview here.</p>
      {!user && (
        <Button onClick={handleLoginRedirect} className="mt-4">
          Login
        </Button>
      )}
    </div>
  );
}