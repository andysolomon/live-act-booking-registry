export type SelectableRole = "venue_owner" | "performer" | "planner";
export type AdminRole = "admin" | "city_manager";
export type UserRole = SelectableRole | AdminRole;

export const SELECTABLE_ROLES: {
  value: SelectableRole;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    value: "venue_owner",
    label: "Venue Owner",
    description:
      "You run a bar, club, or event space and want to discover and book reliable live acts for your venue.",
    icon: "🏢",
  },
  {
    value: "performer",
    label: "Performer",
    description:
      "You're a musician, band, or live act looking to get booked at venues and build your reputation.",
    icon: "🎤",
  },
  {
    value: "planner",
    label: "Event Planner",
    description:
      "You organize private events, weddings, or corporate gatherings and need to book live entertainment.",
    icon: "📋",
  },
];
