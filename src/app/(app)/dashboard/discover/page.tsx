import { getAuthenticatedUser } from "@/lib/auth";
import { PerformerGrid } from "@/components/performer-grid";
import type { Id } from "../../../../../convex/_generated/dataModel";

export default async function DiscoverPage() {
  const { convexUser } = await getAuthenticatedUser();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Discover Performers
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Browse and filter live acts in your city.
        </p>
      </div>
      <PerformerGrid cityId={convexUser.cityId as Id<"cities">} />
    </div>
  );
}
