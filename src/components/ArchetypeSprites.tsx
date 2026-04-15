"use client";

import { useMemo, useState } from "react";
import { getArchetypeSprites } from "@/lib/archetype-sprites";

type ArchetypeSpritesProps = {
  archetype: string | null | undefined;
  size?: "sm" | "md";
  className?: string;
};

function getInitials(archetype: string | null | undefined) {
  if (!archetype) {
    return "?";
  }

  return archetype
    .split(/\s+/)
    .filter((part) => part && !["ex", "box"].includes(part.toLowerCase()))
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function ArchetypeSprites({
  archetype,
  size = "sm",
  className = "",
}: ArchetypeSpritesProps) {
  const sprites = useMemo(() => getArchetypeSprites(archetype), [archetype]);
  const [failedSpritesByArchetype, setFailedSpritesByArchetype] = useState<
    Record<string, string[]>
  >({});
  const failedSpriteKey = archetype ?? "";
  const failedSprites = failedSpritesByArchetype[failedSpriteKey] ?? [];

  const visibleSprites = sprites.filter(
    (sprite) => !failedSprites.includes(sprite.filename)
  );
  const dimensions = size === "md" ? "size-8" : "size-7";
  const imageDimensions = size === "md" ? "size-7" : "size-6";
  const offset = size === "md" ? "-ml-2" : "-ml-1.5";
  const fallbackText = getInitials(archetype);

  if (!visibleSprites.length) {
    return (
      <span
        className={`inline-flex ${dimensions} items-center justify-center rounded-md bg-[#4F8CFF]/14 text-xs font-semibold text-[#F8FAFC] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.24)] ${className}`}
        aria-label={`${archetype ?? "Unknown archetype"} sprite fallback`}
        title={archetype ?? "Unknown archetype"}
      >
        {fallbackText}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center ${className}`}
      aria-label={`${archetype ?? "Unknown archetype"} sprite`}
      title={archetype ?? "Unknown archetype"}
    >
      {visibleSprites.slice(0, 2).map((sprite, index) => (
        <span
          key={sprite.filename}
          className={`inline-flex ${dimensions} items-center justify-center rounded-md bg-[#0B1020]/52 shadow-[0_8px_22px_rgba(0,0,0,0.24),inset_0_0_0_1px_rgba(248,250,252,0.08)] ${
            index > 0 ? offset : ""
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/sprites/${sprite.filename}`}
            alt=""
            className={`${imageDimensions} object-contain`}
            loading="lazy"
            onError={() =>
              setFailedSpritesByArchetype((current) => {
                const failedForArchetype = current[failedSpriteKey] ?? [];

                if (failedForArchetype.includes(sprite.filename)) {
                  return current;
                }

                return {
                  ...current,
                  [failedSpriteKey]: [
                    ...failedForArchetype,
                    sprite.filename,
                  ],
                };
              })
            }
          />
        </span>
      ))}
    </span>
  );
}
