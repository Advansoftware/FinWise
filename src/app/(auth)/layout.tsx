
'use client';

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Logo } from "@/components/logo";
import { Skeleton } from "@/components/ui/skeleton";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If auth is done loading and there IS a user,
    // they don't belong on login/signup, so redirect them away.
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // While loading, or if a user is found, show a loader
  // to prevent a flash of the login form.
  if (loading || user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <Logo className="h-12 w-12 text-primary" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    );
  }

  // If loading is finished and there's no user, show the auth form.
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {children}
      </div>
    </main>
  );
}
