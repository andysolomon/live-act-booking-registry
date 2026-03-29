import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth";
import { canAccessRoute } from "@/lib/route-access";
import { AdminCityRequests } from "@/components/admin-city-requests";

export default async function AdminCitiesPage() {
  const { convexUser } = await getAuthenticatedUser();

  if (!canAccessRoute(convexUser.role, "/dashboard/admin")) {
    redirect("/dashboard");
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          City Requests
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Review and approve or reject city requests from users.
        </p>
      </div>
      <AdminCityRequests />
    </div>
  );
}
