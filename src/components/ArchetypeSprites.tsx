"use client";

import Image from "next/image";
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
  const [failedSprites, setFailedSprites] = useState<string[]>([]);
  const visibleSprites = sprites.filter(
    (sprite) => !failedSprites.includes(sprite.filename)
  );
  const dimensions = size === "md" ? "size-12" : "size-9";
  const imageDimensions = size === "md" ? "size-10" : "size-8";
  const offset = size === "md" ? "-ml-3" : "-ml-2";
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
          <Image
            src={`/sprites/${sprite.filename}`}
            alt=""
            width={size === "md" ? 40 : 32}
            height={size === "md" ? 40 : 32}
            className={`${imageDimensions} object-contain`}
            loading="lazy"
            onError={() =>
              setFailedSprites((current) =>
                current.includes(sprite.filename)
                  ? current
                  : [...current, sprite.filename]
              )
            }
          />
        </span>
      ))}
    </span>
  );
}
