"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/lib/roles";

type NavItem = {
  label: string;
  href: string;
};

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  venue_owner: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Bookings", href: "/dashboard/bookings" },
    { label: "Venue Settings", href: "/dashboard/venue-settings" },
  ],
  performer: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Bookings", href: "/dashboard/bookings" },
    { label: "Profile", href: "/dashboard/profile" },
    { label: "Availability", href: "/dashboard/availability" },
  ],
  planner: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Events", href: "/dashboard/events" },
    { label: "Bookings", href: "/dashboard/bookings" },
  ],
  admin: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Users", href: "/dashboard/admin/users" },
    { label: "Cities", href: "/dashboard/admin/cities" },
    { label: "Disputes", href: "/dashboard/admin/disputes" },
  ],
  city_manager: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Users", href: "/dashboard/admin/users" },
    { label: "Cities", href: "/dashboard/admin/cities" },
    { label: "Disputes", href: "/dashboard/admin/disputes" },
  ],
};

export function DashboardNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const items = NAV_ITEMS[role] ?? NAV_ITEMS.performer;

  return (
    <nav className="flex gap-1">
      {items.map((item) => {
        const isActive =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
