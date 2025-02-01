"use client";

import ConversationList from "@/components/ConversationList"; // your left pane code

// This layout ensures any route under /dashboard/chats/* 
// uses a two-column split: left for the list, right for the child route
export default function ChatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      {/* LEFT COLUMN: conversation list */}
      <aside className="w-1/3 overflow-y-auto ">
        <ConversationList />
      </aside>

      {/* RIGHT COLUMN: dynamic child content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
