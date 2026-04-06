"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import Link from "next/link";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { PerformerFilters } from "./performer-filters";

export function PerformerGrid({ cityId }: { cityId: Id<"cities"> }) {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  const performers = useQuery(api.performers.searchPerformers, {
    cityId,
    ...(selectedGenres.length > 0 ? { genres: selectedGenres } : {}),
  });

  if (!performers) {
    return <p className="text-sm text-zinc-500">Loading performers...</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <PerformerFilters
        selectedGenres={selectedGenres}
        onGenresChange={setSelectedGenres}
      />

      {performers.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500">
            {selectedGenres.length > 0
              ? "No performers match your filters."
              : "No performers in your city yet. Check back soon!"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {performers.map((performer) => (
            <Link
              key={performer._id}
              href={`/performers/${performer._id}`}
              className="group rounded-lg border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
            >
              <h3 className="font-semibold text-zinc-900 group-hover:text-zinc-700 dark:text-zinc-50 dark:group-hover:text-zinc-300">
                {performer.stageName}
              </h3>
              <div className="mt-2 flex flex-wrap gap-1">
                {performer.genres.slice(0, 3).map((genre) => (
                  <span
                    key={genre}
                    className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                  >
                    {genre}
                  </span>
                ))}
                {performer.genres.length > 3 && (
                  <span className="text-xs text-zinc-400">
                    +{performer.genres.length - 3}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                {performer.baseRateCents
                  ? `$${(performer.baseRateCents / 100).toFixed(0)}/gig`
                  : "Contact for pricing"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
