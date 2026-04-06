import { fetchQuery } from "convex/nextjs";
import { notFound } from "next/navigation";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { AvailabilityCalendar } from "@/components/availability-calendar";
import { getAuthenticatedUser } from "@/lib/auth";
import Link from "next/link";

export default async function PerformerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await getAuthenticatedUser();

  const performer = await fetchQuery(api.performers.getPerformerById, {
    performerId: id as Id<"performers">,
  });

  if (!performer) notFound();

  const city = await fetchQuery(api.cities.getCityById, {
    cityId: performer.cityId,
  });

  return (
    <div className="p-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            {performer.stageName}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {city?.name}, {city?.stateOrRegion}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-3 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                About
              </h2>
              <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {performer.bio}
              </p>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-3 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                Details
              </h2>
              <dl className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-zinc-500 dark:text-zinc-400">Genres</dt>
                  <dd className="flex flex-wrap gap-1">
                    {performer.genres.map((g) => (
                      <span
                        key={g}
                        className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800"
                      >
                        {g}
                      </span>
                    ))}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-500 dark:text-zinc-400">Rate</dt>
                  <dd className="text-zinc-900 dark:text-zinc-50">
                    {performer.baseRateCents
                      ? `$${(performer.baseRateCents / 100).toFixed(0)}/gig`
                      : "Contact for pricing"}
                  </dd>
                </div>
              </dl>
            </div>

            <Link
              href={`/dashboard/bookings?performer=${performer._id}`}
              className="flex h-12 items-center justify-center rounded-full bg-zinc-900 px-8 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              Request Booking
            </Link>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Availability (30 days)
            </h2>
            <AvailabilityCalendar performerId={performer._id} />
          </div>
        </div>
      </div>
    </div>
  );
}
