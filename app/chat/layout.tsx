// app/chat/layout.tsx

export const metadata = {
    title: 'Chat',
  };
  
  export default function ChatLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <section className="bg-gray-50 min-h-screen">
        {/* Maybe a Chat-specific sidebar/header here */}
        {children}
      </section>
    );
  }
  