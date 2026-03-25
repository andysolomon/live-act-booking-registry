import { currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const convexUser = await fetchQuery(api.users.getUserByClerkId, {
    clerkId: user.id,
  });

  if (!convexUser?.role) {
    redirect("/onboarding/role-selection");
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Dashboard
        </h1>
        <UserButton />
      </header>
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-zinc-600 dark:text-zinc-400">
          Welcome, {user.firstName ?? user.emailAddresses[0]?.emailAddress}. You
          are signed in as a{" "}
          <span className="font-medium text-zinc-900 dark:text-zinc-50">
            {convexUser.role.replace("_", " ")}
          </span>
          .
        </p>
      </div>
    </main>
  );
}
