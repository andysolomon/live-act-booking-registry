import { fetchQuery } from "convex/nextjs";
import { notFound } from "next/navigation";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { getAuthenticatedUser } from "@/lib/auth";

export default async function VenueProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await getAuthenticatedUser();

  const venue = await fetchQuery(api.venues.getVenueById, {
    venueId: id as Id<"venues">,
  });

  if (!venue) notFound();

  const city = await fetchQuery(api.cities.getCityById, {
    cityId: venue.cityId,
  });

  return (
    <div className="p-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            {venue.name}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {city?.name}, {city?.stateOrRegion}
          </p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-3 text-sm font-medium text-zinc-900 dark:text-zinc-50">
            Venue Details
          </h2>
          <dl className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-zinc-500 dark:text-zinc-400">Address</dt>
              <dd className="text-zinc-900 dark:text-zinc-50">
                {venue.address}
              </dd>
            </div>
            {venue.capacity && (
              <div className="flex justify-between">
                <dt className="text-zinc-500 dark:text-zinc-400">Capacity</dt>
                <dd className="text-zinc-900 dark:text-zinc-50">
                  {venue.capacity}
                </dd>
              </div>
            )}
            {"isTemporary" in venue && venue.isTemporary && (
              <div className="rounded bg-yellow-50 p-2 text-xs text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300">
                Unverified venue — created by an event planner
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}
