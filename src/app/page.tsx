import { Show } from "@clerk/nextjs";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-zinc-950">
      <main className="flex flex-1 w-full max-w-2xl flex-col items-center justify-center gap-8 px-6 py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
          Live Act Booking Registry
        </h1>
        <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          Find, vet, and rebook live performers with verified reliability,
          crowd-draw history, and venue feedback.
        </p>

        <Show
          when="signed-out"
          fallback={
            <Link
              href="/dashboard"
              className="flex h-12 items-center justify-center rounded-full bg-zinc-900 px-8 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              Go to Dashboard
            </Link>
          }
        >
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              href="/sign-up"
              className="flex h-12 items-center justify-center rounded-full bg-zinc-900 px-8 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              Get Started
            </Link>
            <Link
              href="/sign-in"
              className="flex h-12 items-center justify-center rounded-full border border-zinc-300 px-8 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-800"
            >
              Sign In
            </Link>
          </div>
        </Show>
      </main>
    </div>
  );
}
