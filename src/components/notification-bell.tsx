"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export function NotificationBell() {
  const { user } = useUser();
  const [open, setOpen] = useState(false);

  const unreadCount = useQuery(
    api.notifications.getUnreadCount,
    user ? { clerkId: user.id } : "skip",
  );
  const notifications = useQuery(
    api.notifications.getNotifications,
    user && open ? { clerkId: user.id, limit: 20 } : "skip",
  );
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  async function handleNotificationClick(
    notificationId: Id<"notifications">,
    read: boolean,
  ) {
    if (!read) {
      await markAsRead({ notificationId });
    }
  }

  async function handleMarkAllRead() {
    if (!user) return;
    await markAllAsRead({ clerkId: user.id });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative rounded-full p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
        aria-label="Notifications"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-5 w-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
          />
        </svg>
        {unreadCount !== undefined && unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-medium text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full z-20 mt-2 w-80 rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
              <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                Notifications
              </h3>
              {unreadCount !== undefined && unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {!notifications ? (
                <p className="p-4 text-sm text-zinc-500">Loading...</p>
              ) : notifications.length === 0 ? (
                <p className="p-4 text-sm text-zinc-500">
                  No notifications yet.
                </p>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n._id}
                    type="button"
                    onClick={() => handleNotificationClick(n._id, n.read)}
                    className={`flex w-full flex-col items-start gap-1 border-b border-zinc-100 px-4 py-3 text-left last:border-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800 ${
                      !n.read ? "bg-blue-50/50 dark:bg-blue-950/20" : ""
                    }`}
                  >
                    <div className="flex w-full items-start justify-between gap-2">
                      <p className="text-sm text-zinc-900 dark:text-zinc-50">
                        {n.message}
                      </p>
                      {!n.read && (
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                      )}
                    </div>
                    <span className="text-xs text-zinc-500">
                      {timeAgo(n.createdAt)}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
