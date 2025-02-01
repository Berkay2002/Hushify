"use client";

import Link from "next/link";
import {
  Home,
  LineChart,
  PanelLeft,
  Settings,
  Users2,
  Mail
} from "lucide-react";
import { createIcons, icons } from "lucide";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { Analytics } from "@vercel/analytics/react";
import { useEffect } from "react";

// 1) Import the *server side* wrapper that encloses AuthProvider
import Providers from "./providers";

// 2) Import your user dropdown (client component) which uses Firebase Auth
import { User } from "./user";

import { NavItem } from "./nav-item";

// Import the ThemeToggle component for dark/light mode
import ThemeToggle from "@/components/ThemeToggle"; // adjust the path if needed

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    createIcons({ icons });
  }, []);

  return (
    // 3) Wrap everything in your Providers (which in turn wraps <AuthProvider>).
    <Providers>
      <main className="flex min-h-screen w-full flex-col bg-muted/40">
        <DesktopNav />
        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            <MobileNav />
          </header>
          <main className="grid flex-1 items-start gap-2 p-4 sm:px-6 sm:py-0 md:gap-4 bg-muted/40">
            {children}
          </main>
        </div>
        <Analytics />
      </main>
    </Providers>
  );
}

function DesktopNav() {
  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
      <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
        <NavItem href="/" label="Dashboard">
          <Home className="h-5 w-5" />
        </NavItem>
        <NavItem href="/chats" label="Chats">
          <Mail className="h-5 w-5" />
        </NavItem>
        <NavItem href="/friends" label="Friends">
          <Users2 className="h-5 w-5" />
        </NavItem>
      </nav>
      <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="#"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
            >
              <Settings className="h-5 w-5" />
              <span className="sr-only">Settings</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">Settings</TooltipContent>
        </Tooltip>
        {/* Insert ThemeToggle between Settings and User */}
        <ThemeToggle />
        <User />
      </nav>
    </aside>
  );
}

function MobileNav() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="icon" variant="outline" className="sm:hidden">
          <PanelLeft className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="sm:max-w-xs">
        <nav className="grid gap-6 text-lg font-medium">
          <Link
            href="/"
            className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
          >
            <Home className="h-5 w-5" />
            Dashboard
          </Link>
          <Link
            href="/chat"
            className="flex items-center gap-4 px-2.5 text-foreground"
          >
            <Mail className="h-5 w-5" />
            Chats
          </Link>
          <Link
            href="/friends"
            className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
          >
            <Users2 className="h-5 w-5" />
            Friends
          </Link>
          <Link
            href="#"
            className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
          >
            <LineChart className="h-5 w-5" />
            Settings
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
