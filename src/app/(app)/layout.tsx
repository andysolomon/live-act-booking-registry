import { UserButton } from "@clerk/nextjs";
import { getAuthenticatedUser } from "@/lib/auth";
import { DashboardNav } from "@/components/dashboard-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { clerkUser, convexUser } = await getAuthenticatedUser();

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white px-6 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              LABR
            </span>
            <DashboardNav role={convexUser.role} />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {clerkUser.firstName ?? clerkUser.emailAddresses[0]?.emailAddress}
            </span>
            <UserButton />
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
