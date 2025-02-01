'use client';

import { useAuth } from '@/lib/context/AuthContext';
import { signOut } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';

export function User() {
  // Grab the current user from your AuthContext
  const { user } = useAuth();

  // Handler for sign-out
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // If user is null or undefined, show nothing or a "Sign In" placeholder
  if (!user) {
    return null; // or return <Button onClick={() => signInWithGoogle()}>Sign In</Button>;
  }

  // Render dropdown with user's photo + sign out
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="overflow-hidden rounded-full">
          <Image
            src={user.photoURL ?? '/placeholder-user.jpg'}
            alt="Avatar"
            width={36}
            height={36}
            className="rounded-full"
          />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" side="right" className="opacity-90">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Settings</DropdownMenuItem>
        <DropdownMenuItem>Support</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>Sign Out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}