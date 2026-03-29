"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export function AdminCityRequests() {
  const requests = useQuery(api.cityRequests.getPendingRequests);
  const approveCity = useMutation(api.cityRequests.approveCity);
  const rejectCity = useMutation(api.cityRequests.rejectCity);
  const { user } = useUser();

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  async function handleApprove(requestId: Id<"cityRequests">) {
    if (!user) return;
    await approveCity({ adminClerkId: user.id, requestId });
  }

  async function handleReject(requestId: Id<"cityRequests">) {
    if (!user || !rejectionReason.trim()) return;
    await rejectCity({
      adminClerkId: user.id,
      requestId,
      rejectionReason: rejectionReason.trim(),
    });
    setRejectingId(null);
    setRejectionReason("");
  }

  if (!requests) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading...</p>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No pending city requests.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-800">
            <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">
              City
            </th>
            <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">
              State
            </th>
            <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">
              Requested
            </th>
            <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {requests.map((req) => (
            <tr
              key={req._id}
              className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
            >
              <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                {req.name}
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                {req.stateOrRegion}, {req.country}
              </td>
              <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                {new Date(req.createdAt).toLocaleDateString()}
              </td>
              <td className="px-4 py-3">
                {rejectingId === req._id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Rejection reason..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                    />
                    <button
                      type="button"
                      onClick={() => handleReject(req._id)}
                      disabled={!rejectionReason.trim()}
                      className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRejectingId(null);
                        setRejectionReason("");
                      }}
                      className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleApprove(req._id)}
                      className="rounded bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => setRejectingId(req._id)}
                      className="rounded border border-red-300 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
