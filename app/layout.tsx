import './globals.css';
import { Analytics } from '@vercel/analytics/react';
import { AuthProvider } from '@/lib/context/AuthContext';
import ClientPresence from './ClientPresence';

export const metadata = {
  title: 'Hushify',
  description: 'Secure Real-time Chat App',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen w-full flex-col dark:bg-[#313338]">
        {/* Wrap your entire app with AuthProvider here */}
        <AuthProvider>
          <ClientPresence />
          {children}
        </AuthProvider>

        <Analytics />
      </body>
    </html>
  );
}
