"use client";

import { GENRES } from "@/lib/constants";

export function PerformerFilters({
  selectedGenres,
  onGenresChange,
}: {
  selectedGenres: string[];
  onGenresChange: (genres: string[]) => void;
}) {
  function toggleGenre(genre: string) {
    onGenresChange(
      selectedGenres.includes(genre)
        ? selectedGenres.filter((g) => g !== genre)
        : [...selectedGenres, genre],
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
        Filter by Genre
      </h3>
      <div className="flex flex-wrap gap-2">
        {GENRES.map((genre) => (
          <button
            key={genre}
            type="button"
            onClick={() => toggleGenre(genre)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              selectedGenres.includes(genre)
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "border border-zinc-300 text-zinc-600 hover:border-zinc-500 dark:border-zinc-600 dark:text-zinc-400"
            }`}
          >
            {genre}
          </button>
        ))}
        {selectedGenres.length > 0 && (
          <button
            type="button"
            onClick={() => onGenresChange([])}
            className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
