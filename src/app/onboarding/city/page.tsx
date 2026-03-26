import { CitySelector } from "@/components/city-selector";

export default function CitySelectionPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 py-24 dark:bg-zinc-950">
      <div className="flex w-full max-w-2xl flex-col items-center gap-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Where are you based?
        </h1>
        <p className="max-w-md text-zinc-500 dark:text-zinc-400">
          Select your city to see local performers and venues.
        </p>
        <CitySelector />
      </div>
    </div>
  );
}
