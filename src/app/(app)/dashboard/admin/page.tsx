import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth";
import { canAccessRoute } from "@/lib/route-access";

export default async function AdminPage() {
  const { convexUser } = await getAuthenticatedUser();

  if (!canAccessRoute(convexUser.role, "/dashboard/admin")) {
    redirect("/dashboard");
  }

  return (
    <div className="p-6">
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Admin Panel
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Manage users, cities, disputes, and platform settings. Coming soon.
        </p>
      </div>
    </div>
  );
}
