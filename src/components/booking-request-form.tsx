"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export function BookingRequestForm({
  performerId,
  performerName,
  baseRateCents,
  venueId,
}: {
  performerId: Id<"performers">;
  performerName: string;
  baseRateCents?: number;
  venueId?: Id<"venues">;
}) {
  const { user } = useUser();
  const router = useRouter();
  const createBooking = useMutation(api.bookings.createBookingRequest);

  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("20:00");
  const [endTime, setEndTime] = useState("23:00");
  const [rate, setRate] = useState(
    baseRateCents ? (baseRateCents / 100).toString() : "",
  );
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const availability = useQuery(
    api.availability.isPerformerAvailable,
    eventDate ? { performerId, date: eventDate } : "skip",
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !eventDate || !rate || !venueId) return;

    if (availability && !availability.available) {
      setError(availability.reason);
      return;
    }

    setLoading(true);
    setError("");
    try {
      await createBooking({
        requestedBy: user.id,
        performerId,
        venueId,
        eventDate,
        offeredRateCents: Math.round(parseFloat(rate) * 100),
        startTime,
        endTime,
        description: description.trim() || undefined,
      });
      router.push("/dashboard/bookings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create booking");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Performer
        </label>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {performerName}
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Event Date *
        </label>
        <input
          type="date"
          required
          value={eventDate}
          onChange={(e) => {
            setEventDate(e.target.value);
            setError("");
          }}
          min={new Date().toISOString().split("T")[0]}
          className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
        {eventDate && availability && !availability.available && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {availability.reason}
          </p>
        )}
        {eventDate && availability?.available && (
          <p className="mt-1 text-sm text-green-600 dark:text-green-400">
            Available
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-900 dark:text-zinc-50">
            Start Time *
          </label>
          <input
            type="time"
            required
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-900 dark:text-zinc-50">
            End Time *
          </label>
          <input
            type="time"
            required
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Offered Rate (USD) *
        </label>
        <input
          type="number"
          required
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          min="0"
          step="1"
          placeholder="e.g., 500"
          className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, 500))}
          placeholder="Tell the performer about the event..."
          rows={3}
          className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <button
        type="submit"
        disabled={
          !eventDate ||
          !rate ||
          !venueId ||
          loading ||
          (availability !== undefined && !availability?.available)
        }
        className="flex h-12 items-center justify-center rounded-full bg-zinc-900 px-10 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {loading ? "Sending Request..." : "Send Booking Request"}
      </button>
    </form>
  );
}
