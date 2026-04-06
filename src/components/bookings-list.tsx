"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { UserRole } from "@/lib/roles";

type Tab = "pending" | "upcoming" | "past";

export function BookingsList({ role }: { role: UserRole }) {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const performerBookings = useQuery(
    api.bookings.getBookingsForPerformer,
    role === "performer" && user ? { clerkId: user.id } : "skip",
  );
  const venueBookings = useQuery(
    api.bookings.getBookingsForVenue,
    role === "venue_owner" && user ? { clerkId: user.id } : "skip",
  );
  const requesterBookings = useQuery(
    api.bookings.getBookingsForRequester,
    role === "planner" && user ? { clerkId: user.id } : "skip",
  );

  const respondToBooking = useMutation(api.bookings.respondToBooking);
  const cancelBooking = useMutation(api.bookings.cancelBooking);
  const markCompleted = useMutation(api.bookings.markCompleted);

  const bookings =
    role === "performer"
      ? performerBookings
      : role === "venue_owner"
        ? venueBookings
        : requesterBookings;

  if (!bookings || !user) {
    return <p className="text-sm text-zinc-500">Loading bookings...</p>;
  }

  const pending = bookings.filter(
    (b) => b.status === "pending" || b.status === "declined",
  );
  const upcoming = bookings.filter(
    (b) => b.status === "accepted" || b.status === "in_progress",
  );
  const past = bookings.filter(
    (b) =>
      b.status === "completed" ||
      b.status === "canceled" ||
      b.status === "disputed",
  );

  const displayed =
    activeTab === "pending"
      ? pending
      : activeTab === "upcoming"
        ? upcoming
        : past;

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "pending", label: "Pending", count: pending.length },
    { key: "upcoming", label: "Upcoming", count: upcoming.length },
    { key: "past", label: "Past", count: past.length },
  ];

  async function handleAccept(bookingId: Id<"bookings">) {
    if (!user) return;
    await respondToBooking({
      performerClerkId: user.id,
      bookingId,
      response: "accept",
    });
  }

  async function handleDecline(bookingId: Id<"bookings">) {
    if (!user) return;
    await respondToBooking({
      performerClerkId: user.id,
      bookingId,
      response: "decline",
    });
  }

  async function handleCancel(bookingId: Id<"bookings">) {
    if (!user || !cancelReason.trim()) return;
    const canceledByRole =
      role === "performer"
        ? "performer"
        : role === "venue_owner"
          ? "venue"
          : "planner";
    await cancelBooking({
      bookingId,
      reason: cancelReason.trim(),
      canceledBy: canceledByRole as "venue" | "performer" | "planner",
    });
    setCancelingId(null);
    setCancelReason("");
  }

  async function handleComplete(bookingId: Id<"bookings">) {
    await markCompleted({ bookingId });
  }

  const statusColors: Record<string, string> = {
    pending:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    accepted:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    declined: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    in_progress:
      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    completed:
      "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
    canceled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    disputed:
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  };

  return (
    <div>
      <div className="mb-4 flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {displayed.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500">
            No {activeTab} bookings.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {displayed.map((booking) => (
            <div
              key={booking._id}
              className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    {"performerName" in booking
                      ? booking.performerName
                      : "venueName" in booking
                        ? booking.venueName
                        : "Booking"}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {booking.eventDate} &middot; {booking.startTime}–
                    {booking.endTime} &middot; $
                    {(booking.offeredRateCents / 100).toFixed(0)}
                  </p>
                  {"venueName" in booking && role === "performer" && (
                    <p className="text-sm text-zinc-500">
                      at {booking.venueName}
                    </p>
                  )}
                  {booking.description && (
                    <p className="mt-1 text-sm text-zinc-400">
                      {booking.description}
                    </p>
                  )}
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[booking.status] ?? ""}`}
                >
                  {booking.status.replace("_", " ")}
                </span>
              </div>

              <div className="mt-3 flex gap-2">
                {role === "performer" && booking.status === "pending" && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleAccept(booking._id)}
                      className="rounded bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDecline(booking._id)}
                      className="rounded border border-red-300 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400"
                    >
                      Decline
                    </button>
                  </>
                )}

                {(booking.status === "pending" ||
                  booking.status === "accepted") &&
                  cancelingId !== booking._id && (
                    <button
                      type="button"
                      onClick={() => setCancelingId(booking._id)}
                      className="text-xs text-zinc-500 hover:text-red-600"
                    >
                      Cancel
                    </button>
                  )}

                {cancelingId === booking._id && (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Reason..."
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                    />
                    <button
                      type="button"
                      onClick={() => handleCancel(booking._id)}
                      disabled={!cancelReason.trim()}
                      className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCancelingId(null);
                        setCancelReason("");
                      }}
                      className="text-xs text-zinc-500"
                    >
                      Back
                    </button>
                  </div>
                )}

                {booking.status === "in_progress" && (
                  <button
                    type="button"
                    onClick={() => handleComplete(booking._id)}
                    className="rounded bg-zinc-900 px-3 py-1 text-xs font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900"
                  >
                    Mark Complete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
