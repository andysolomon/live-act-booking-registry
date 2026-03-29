"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export function VenueProfileForm({
  cityId,
  cityName,
}: {
  cityId: string;
  cityName: string;
}) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [capacity, setCapacity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const createVenue = useMutation(api.venues.createVenue);
  const { user } = useUser();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !name.trim() || !address.trim()) return;

    setLoading(true);
    setError("");
    try {
      await createVenue({
        clerkId: user.id,
        name: name.trim(),
        address: address.trim(),
        cityId: cityId as Id<"cities">,
        ...(capacity ? { capacity: parseInt(capacity, 10) } : {}),
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
          Venue Name *
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., The Blue Note"
          className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Address *
        </label>
        <input
          type="text"
          required
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="e.g., 131 W 3rd St"
          className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Capacity
        </label>
        <input
          type="number"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          placeholder="e.g., 200"
          min="1"
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
        disabled={!name.trim() || !address.trim() || loading}
        className="flex h-12 items-center justify-center rounded-full bg-zinc-900 px-10 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {loading ? "Creating..." : "Complete Setup"}
      </button>
    </form>
  );
}
