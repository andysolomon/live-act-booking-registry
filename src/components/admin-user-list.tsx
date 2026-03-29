"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export function AdminUserList() {
  const users = useQuery(api.users.listUsers);
  const cities = useQuery(api.cities.getActiveCities);
  const setAdminRole = useMutation(api.users.setAdminRole);
  const suspendUser = useMutation(api.users.suspendUser);
  const unsuspendUser = useMutation(api.users.unsuspendUser);
  const { user: clerkUser } = useUser();

  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<"admin" | "city_manager">(
    "city_manager",
  );
  const [selectedCityId, setSelectedCityId] = useState<string>("");

  async function handleAssign(targetClerkId: string) {
    if (!clerkUser) return;
    try {
      await setAdminRole({
        adminClerkId: clerkUser.id,
        targetClerkId,
        role: selectedRole,
        ...(selectedRole === "city_manager" && selectedCityId
          ? { cityId: selectedCityId as Id<"cities"> }
          : {}),
      });
      setAssigningId(null);
    } catch (err) {
      console.error("Failed to assign role:", err);
    }
  }

  async function handleSuspend(targetClerkId: string) {
    if (!clerkUser) return;
    await suspendUser({ adminClerkId: clerkUser.id, targetClerkId });
  }

  async function handleUnsuspend(targetClerkId: string) {
    if (!clerkUser) return;
    await unsuspendUser({ adminClerkId: clerkUser.id, targetClerkId });
  }

  if (!users || !cities) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading...</p>;
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-800">
            <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">
              Clerk ID
            </th>
            <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">
              Role
            </th>
            <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">
              Status
            </th>
            <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr
              key={u._id}
              className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
            >
              <td className="px-4 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                {u.clerkId.slice(0, 20)}...
              </td>
              <td className="px-4 py-3 text-zinc-900 dark:text-zinc-50">
                {u.role?.replace("_", " ") ?? "No role"}
              </td>
              <td className="px-4 py-3">
                {u.status === "suspended" ? (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900 dark:text-red-300">
                    Suspended
                  </span>
                ) : (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
                    Active
                  </span>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {assigningId === u.clerkId ? (
                    <>
                      <select
                        value={selectedRole}
                        onChange={(e) =>
                          setSelectedRole(e.target.value as "admin" | "city_manager")
                        }
                        className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                      >
                        <option value="admin">Admin</option>
                        <option value="city_manager">City Manager</option>
                      </select>
                      {selectedRole === "city_manager" && (
                        <select
                          value={selectedCityId}
                          onChange={(e) => setSelectedCityId(e.target.value)}
                          className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                        >
                          <option value="">Select city...</option>
                          {cities.map((c) => (
                            <option key={c._id} value={c._id}>
                              {c.name}, {c.stateOrRegion}
                            </option>
                          ))}
                        </select>
                      )}
                      <button
                        type="button"
                        onClick={() => handleAssign(u.clerkId)}
                        disabled={selectedRole === "city_manager" && !selectedCityId}
                        className="rounded bg-zinc-900 px-3 py-1 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => setAssigningId(null)}
                        className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setAssigningId(u.clerkId)}
                        className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
                      >
                        Set Role
                      </button>
                      {u.role !== "admin" && (
                        <>
                          {u.status === "suspended" ? (
                            <button
                              type="button"
                              onClick={() => handleUnsuspend(u.clerkId)}
                              className="rounded bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700"
                            >
                              Unsuspend
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSuspend(u.clerkId)}
                              className="rounded border border-red-300 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                            >
                              Suspend
                            </button>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
