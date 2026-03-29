import { getAuthenticatedUser } from "@/lib/auth";
import { canAccessRoute } from "@/lib/route-access";
import { redirect } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import { PerformerEditForm } from "@/components/performer-edit-form";

export default async function PerformerProfilePage() {
  const { convexUser } = await getAuthenticatedUser();

  if (!canAccessRoute(convexUser.role, "/dashboard/profile")) {
    redirect("/dashboard");
  }

  const city = convexUser.cityId
    ? await fetchQuery(api.cities.getCityById, { cityId: convexUser.cityId })
    : null;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Profile
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Update your performer profile. Changes are saved in real-time.
        </p>
      </div>
      <div className="max-w-md rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <PerformerEditForm cityName={city?.name ?? "Unknown"} />
      </div>
    </div>
  );
}
