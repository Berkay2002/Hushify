import './globals.css';
import { Analytics } from '@vercel/analytics/react';
import { AuthProvider } from '@/lib/context/AuthContext';

export const metadata = {
  title: 'Hushify',
  description: 'Secure Real-time Chat App',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen w-full flex-col">
        {/* Wrap your entire app with AuthProvider here */}
        <AuthProvider>
          {children}
        </AuthProvider>

        <Analytics />
      </body>
    </html>
  );
}
