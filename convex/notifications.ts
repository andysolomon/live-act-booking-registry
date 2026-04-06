import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

// Internal mutation — called by other mutations to create notifications
export const createNotification = internalMutation({
  args: {
    userId: v.string(),
    type: v.string(),
    message: v.string(),
    relatedId: v.optional(v.string()),
  },
  handler: async (ctx, { userId, type, message, relatedId }) => {
    return await ctx.db.insert("notifications", {
      userId,
      type,
      message,
      read: false,
      relatedId,
      createdAt: Date.now(),
    });
  },
});

export const getNotifications = query({
  args: {
    clerkId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { clerkId, limit = 20 }) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_userId_read", (q) => q.eq("userId", clerkId))
      .collect();

    return notifications
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  },
});

export const getUnreadCount = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId_read", (q) =>
        q.eq("userId", clerkId).eq("read", false),
      )
      .collect();

    return unread.length;
  },
});

export const markAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, { notificationId }) => {
    await ctx.db.patch(notificationId, { read: true });
  },
});

export const markAllAsRead = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId_read", (q) =>
        q.eq("userId", clerkId).eq("read", false),
      )
      .collect();

    for (const n of unread) {
      await ctx.db.patch(n._id, { read: true });
    }

    return { marked: unread.length };
  },
});
