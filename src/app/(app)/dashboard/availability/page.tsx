import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth";
import { canAccessRoute } from "@/lib/route-access";

export default async function AvailabilityPage() {
  const { convexUser } = await getAuthenticatedUser();

  if (!canAccessRoute(convexUser.role, "/dashboard/availability")) {
    redirect("/dashboard");
  }

  return (
    <div className="p-6">
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Availability
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Set your recurring availability and manage date overrides. Coming
          soon.
        </p>
      </div>
    </div>
  );
}
