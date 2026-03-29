"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../convex/_generated/api";
import { GENRES } from "@/lib/constants";

export function PerformerEditForm({ cityName }: { cityName: string }) {
  const { user } = useUser();
  const performer = useQuery(
    api.performers.getPerformerByOwner,
    user ? { clerkId: user.id } : "skip",
  );
  const updatePerformer = useMutation(api.performers.updatePerformer);

  const [stageName, setStageName] = useState<string | null>(null);
  const [genres, setGenres] = useState<string[] | null>(null);
  const [baseRate, setBaseRate] = useState<string | null>(null);
  const [bio, setBio] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  if (!performer || !user) {
    return <p className="text-sm text-zinc-500">Loading...</p>;
  }

  const performerData = performer;
  const currentStageName = stageName ?? performerData.stageName;
  const currentGenres = genres ?? performerData.genres;
  const currentRate =
    baseRate ?? (performerData.baseRateCents ? (performerData.baseRateCents / 100).toString() : "");
  const currentBio = bio ?? performerData.bio;

  function toggleGenre(genre: string) {
    const current = genres ?? performerData.genres;
    setGenres(
      current.includes(genre)
        ? current.filter((g) => g !== genre)
        : [...current, genre],
    );
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await updatePerformer({
        clerkId: user.id,
        ...(stageName !== null ? { stageName } : {}),
        ...(genres !== null ? { genres } : {}),
        ...(baseRate !== null && baseRate
          ? { baseRateCents: Math.round(parseFloat(baseRate) * 100) }
          : {}),
        ...(bio !== null ? { bio } : {}),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Stage Name
        </label>
        <input
          type="text"
          value={currentStageName}
          onChange={(e) => setStageName(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Genres
        </label>
        <div className="flex flex-wrap gap-2">
          {GENRES.map((genre) => (
            <button
              key={genre}
              type="button"
              onClick={() => toggleGenre(genre)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                currentGenres.includes(genre)
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
          Base Rate (USD per gig)
        </label>
        <input
          type="number"
          value={currentRate}
          onChange={(e) => setBaseRate(e.target.value)}
          min="0"
          step="1"
          className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Bio{" "}
          <span className="font-normal text-zinc-500">
            ({currentBio.length}/500)
          </span>
        </label>
        <textarea
          value={currentBio}
          onChange={(e) => setBio(e.target.value.slice(0, 500))}
          rows={4}
          className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-500 dark:text-zinc-400">
          City
        </label>
        <p className="text-sm text-zinc-900 dark:text-zinc-50">{cityName}</p>
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {saved && (
        <p className="text-sm text-green-600 dark:text-green-400">
          Changes saved.
        </p>
      )}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="self-start rounded-lg bg-zinc-900 px-6 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}
