"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { GENRES } from "@/lib/constants";

export function PerformerProfileForm({
  cityId,
  cityName,
}: {
  cityId: string;
  cityName: string;
}) {
  const [stageName, setStageName] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [baseRate, setBaseRate] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const createPerformer = useMutation(api.performers.createPerformer);
  const { user } = useUser();
  const router = useRouter();

  function toggleGenre(genre: string) {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !stageName.trim() || selectedGenres.length === 0 || !bio.trim())
      return;

    setLoading(true);
    setError("");
    try {
      await createPerformer({
        clerkId: user.id,
        stageName: stageName.trim(),
        genres: selectedGenres,
        ...(baseRate
          ? { baseRateCents: Math.round(parseFloat(baseRate) * 100) }
          : {}),
        bio: bio.trim(),
        cityId: cityId as Id<"cities">,
      });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create profile");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Stage Name *
        </label>
        <input
          type="text"
          required
          value={stageName}
          onChange={(e) => setStageName(e.target.value)}
          placeholder="e.g., The Midnight Owls"
          className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Genres * <span className="font-normal text-zinc-500">(select at least one)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {GENRES.map((genre) => (
            <button
              key={genre}
              type="button"
              onClick={() => toggleGenre(genre)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                selectedGenres.includes(genre)
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "border border-zinc-300 text-zinc-600 hover:border-zinc-500 dark:border-zinc-600 dark:text-zinc-400"
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Base Rate (per gig, USD)
        </label>
        <input
          type="number"
          value={baseRate}
          onChange={(e) => setBaseRate(e.target.value)}
          placeholder="e.g., 500"
          min="0"
          step="1"
          className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
        <p className="mt-1 text-xs text-zinc-500">
          Leave blank to show &ldquo;Contact for pricing&rdquo;
        </p>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Bio * <span className="font-normal text-zinc-500">({bio.length}/500)</span>
        </label>
        <textarea
          required
          value={bio}
          onChange={(e) => setBio(e.target.value.slice(0, 500))}
          placeholder="Tell venues about your act, style, and experience..."
          rows={4}
          className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-500 dark:text-zinc-400">
          City
        </label>
        <p className="text-sm text-zinc-900 dark:text-zinc-50">{cityName}</p>
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={
          !stageName.trim() ||
          selectedGenres.length === 0 ||
          !bio.trim() ||
          loading
        }
        className="flex h-12 items-center justify-center rounded-full bg-zinc-900 px-10 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {loading ? "Creating..." : "Complete Setup"}
      </button>
    </form>
  );
}
