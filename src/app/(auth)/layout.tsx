
'use client';
import { Logo } from "@/components/logo";
import { AuthGuard } from "@/components/auth/auth-guard";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen items-center justify-center p-4">
        <main className="w-full max-w-md">{children}</main>
      </div>
    </AuthGuard>
  );
}
