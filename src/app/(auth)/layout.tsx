import { AuthProvider } from "@/hooks/use-auth";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
          <div className="w-full max-w-sm">
              {children}
          </div>
      </main>
    </AuthProvider>
  );
}
