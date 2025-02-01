'use client';

import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { signInWithGoogle } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    try {
      const user = await signInWithGoogle();
      console.log("User signed in:", user);
      router.push('/');
    } catch (error) {
      console.error("Error during Google sign-in:", error);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-start md:items-center p-8 ">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={handleGoogleSignIn} className="w-full bg-gray-100 text-black hover:bg-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20" height="20" className="h-5 w-5 mr-2">
              <path fill="#4285F4" d="M24 9.5c3.1 0 5.6 1.1 7.5 2.9l5.6-5.6C33.4 3.5 28.9 1.5 24 1.5 14.8 1.5 7.1 7.8 4.5 16.1l6.9 5.4C13.1 15.1 18.1 9.5 24 9.5z"/>
              <path fill="#34A853" d="M46.5 24c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3.1-2.4 5.7-4.9 7.4l7.6 5.9c4.4-4.1 7.1-10.1 7.1-17.8z"/>
              <path fill="#FBBC05" d="M10.9 28.5c-1.1-3.1-1.1-6.5 0-9.6L4 13.5C1.5 18.1 1.5 23.9 4 28.5l6.9-5.4z"/>
              <path fill="#EA4335" d="M24 46.5c5.9 0 10.9-2 14.5-5.4l-7.6-5.9c-2.1 1.4-4.8 2.3-7.5 2.3-5.9 0-10.9-4-12.7-9.4l-6.9 5.4C7.1 40.2 14.8 46.5 24 46.5z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            Sign in with Google
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}