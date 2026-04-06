import { getAuthenticatedUser } from "@/lib/auth";
import { BookingsList } from "@/components/bookings-list";

export default async function BookingsPage() {
  const { convexUser } = await getAuthenticatedUser();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Bookings
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {convexUser.role === "performer"
            ? "Manage incoming booking requests and upcoming gigs."
            : "Track your booking requests and upcoming events."}
        </p>
      </div>
      <BookingsList role={convexUser.role} />
    </div>
  );
}
