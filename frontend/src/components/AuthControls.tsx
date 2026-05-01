"use client";

import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export function AuthControls() {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    return (
      <div className="rounded-md border border-line bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
        Dev User
      </div>
    );
  }

  return (
    <>
      <SignedOut>
        <SignInButton mode="modal">
          <button className="rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white">
            Sign in
          </button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <UserButton afterSignOutUrl="/dashboard" />
      </SignedIn>
    </>
  );
}
