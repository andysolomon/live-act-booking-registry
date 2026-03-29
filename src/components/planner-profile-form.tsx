"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { EVENT_TYPES } from "@/lib/constants";

export function PlannerProfileForm({
  cityId,
  cityName,
}: {
  cityId: string;
  cityName: string;
}) {
  const [companyName, setCompanyName] = useState("");
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const createPlanner = useMutation(api.planners.createPlanner);
  const { user } = useUser();
  const router = useRouter();

  function toggleEventType(type: string) {
    setSelectedEventTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || selectedEventTypes.length === 0) return;

    setLoading(true);
    setError("");
    try {
      await createPlanner({
        clerkId: user.id,
        ...(companyName.trim() ? { companyName: companyName.trim() } : {}),
        eventTypes: selectedEventTypes,
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
          Company Name
        </label>
        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="e.g., Premier Events Co."
          className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
        <p className="mt-1 text-xs text-zinc-500">
          Leave blank if you&apos;re an independent planner
        </p>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Event Types *{" "}
          <span className="font-normal text-zinc-500">(select at least one)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {EVENT_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => toggleEventType(type)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                selectedEventTypes.includes(type)
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "border border-zinc-300 text-zinc-600 hover:border-zinc-500 dark:border-zinc-600 dark:text-zinc-400"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
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
        disabled={selectedEventTypes.length === 0 || loading}
        className="flex h-12 items-center justify-center rounded-full bg-zinc-900 px-10 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {loading ? "Creating..." : "Complete Setup"}
      </button>
    </form>
  );
}
