"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../convex/_generated/api";

export function VenueEditForm({ cityName }: { cityName: string }) {
  const { user } = useUser();
  const venue = useQuery(
    api.venues.getVenueByOwner,
    user ? { clerkId: user.id } : "skip",
  );
  const updateVenue = useMutation(api.venues.updateVenue);

  const [name, setName] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [capacity, setCapacity] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  if (!venue || !user) {
    return <p className="text-sm text-zinc-500">Loading...</p>;
  }

  const currentName = name ?? venue.name;
  const currentAddress = address ?? venue.address;
  const currentCapacity = capacity ?? (venue.capacity?.toString() ?? "");

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await updateVenue({
        clerkId: user.id,
        ...(name !== null ? { name } : {}),
        ...(address !== null ? { address } : {}),
        ...(capacity !== null && capacity
          ? { capacity: parseInt(capacity, 10) }
          : {}),
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
          Venue Name
        </label>
        <input
          type="text"
          value={currentName}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Address
        </label>
        <input
          type="text"
          value={currentAddress}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Capacity
        </label>
        <input
          type="number"
          value={currentCapacity}
          onChange={(e) => setCapacity(e.target.value)}
          min="1"
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
