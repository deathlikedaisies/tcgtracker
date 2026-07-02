"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArchetypeSprites } from "@/components/ArchetypeSprites";
import { label as labelClass } from "@/components/brand-styles";
import { ARCHETYPE_POKEMON } from "@/lib/archetype-sprites";

type OpponentDeckComboboxProps = {
  id: string;
  name: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  required?: boolean;
};

const priorityOpponentOptions = [
  "Dragapult",
  "Dragapult Dusknoir",
  "Mega Greninja",
  "Mega Lucario Duns",
  "Mega Lucario Dudunsparce",
  "Raging Bolt",
  "Gholdengo",
  "Starmie",
  "Gardevoir",
  "Charizard",
  "Miraidon",
  "Roaring Moon",
  "Lugia",
  "Chien-Pao",
  "Terapagos",
  "Other / custom",
];

function normalize(value: string) {
  return value
    .trim()
    .replace(/[’‘`]/g, "'")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

const opponentOptions = Array.from(
  new Set([...priorityOpponentOptions, ...Object.keys(ARCHETYPE_POKEMON)])
);

export function OpponentDeckCombobox({
  id,
  name,
  label,
  value,
  onValueChange,
  required = false,
}: OpponentDeckComboboxProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const query = value;

  const visibleOptions = useMemo(() => {
    const normalizedQuery = normalize(query);
    const options = normalizedQuery
      ? opponentOptions.filter((option) =>
          normalize(option).includes(normalizedQuery)
        )
      : opponentOptions;

    return options.slice(0, 10);
  }, [query]);

  const exactMatch = opponentOptions.some(
    (option) => normalize(option) === normalize(query)
  );
  const canUseCustom = query.trim().length > 0 && !exactMatch;
  const menuItems = canUseCustom
    ? [...visibleOptions, query.trim()]
    : visibleOptions;
  const safeActiveIndex = menuItems.length
    ? Math.min(activeIndex, menuItems.length - 1)
    : 0;

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  function selectValue(nextValue: string) {
    onValueChange(nextValue);
    setIsOpen(false);
  }

  return (
    <div ref={wrapperRef} className="relative grid gap-1.5">
      <label htmlFor={`${id}_search`} className={labelClass}>
        {label}
      </label>
      <input type="hidden" id={id} name={name} value={value} />
      <div className="flex min-w-0 items-center gap-3 rounded-2xl bg-[#07111F]/78 px-3 py-2.5 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.12)] transition focus-within:shadow-[inset_0_0_0_1px_rgba(79,140,255,0.46),0_0_0_3px_rgba(79,140,255,0.10)]">
        <ArchetypeSprites
          archetype={value}
          size="md"
          className="shrink-0"
        />
        <input
          id={`${id}_search`}
          type="search"
          value={query}
          required={required}
          autoComplete="off"
          inputMode="search"
          placeholder="Search opponent deck..."
          onFocus={() => setIsOpen(true)}
          onChange={(event) => {
            onValueChange(event.target.value);
            setActiveIndex(0);
            setIsOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setIsOpen(false);
              return;
            }

            if (!isOpen && ["ArrowDown", "ArrowUp", "Enter"].includes(event.key)) {
              setIsOpen(true);
            }

            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((current) =>
                menuItems.length ? (current + 1) % menuItems.length : 0
              );
            }

            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((current) =>
                menuItems.length
                  ? (current - 1 + menuItems.length) % menuItems.length
                  : 0
              );
            }

            if (event.key === "Enter" && isOpen && menuItems[safeActiveIndex]) {
              event.preventDefault();
              selectValue(menuItems[safeActiveIndex]);
            }
          }}
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#F8FAFC] outline-none placeholder:text-[#64748B]"
        />
      </div>

      {isOpen ? (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-72 overflow-y-auto rounded-2xl bg-[#0B1020]/96 p-1.5 shadow-[0_18px_34px_rgba(0,0,0,0.35),inset_0_0_0_1px_rgba(248,250,252,0.08)]">
          <div className="grid gap-1">
            {visibleOptions.map((option, index) => (
              <button
                key={option}
                type="button"
                aria-label={option}
                onClick={() => selectValue(option)}
                className={`flex min-h-11 w-full min-w-0 items-center gap-3 rounded-xl px-2.5 py-2 text-left transition ${
                  safeActiveIndex === index
                    ? "bg-[#4F8CFF]/20 text-[#F8FAFC]"
                    : "text-[#94A3B8] hover:bg-[#1A2238]/58 hover:text-[#F8FAFC]"
                }`}
              >
                <ArchetypeSprites archetype={option} className="shrink-0" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {option}
                </span>
              </button>
            ))}

            {canUseCustom ? (
              <button
                type="button"
                aria-label={`Use custom: ${query.trim()}`}
                onClick={() => selectValue(query.trim())}
                className={`flex min-h-11 w-full min-w-0 items-center gap-3 rounded-xl px-2.5 py-2 text-left transition ${
                  safeActiveIndex === visibleOptions.length
                    ? "bg-[#4F8CFF]/20 text-[#F8FAFC]"
                    : "text-[#F8FAFC] hover:bg-[#1A2238]/58"
                }`}
              >
                <ArchetypeSprites archetype={query.trim()} className="shrink-0" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  Use custom: {query.trim()}
                </span>
              </button>
            ) : null}

            {!visibleOptions.length && !canUseCustom ? (
              <p className="px-2.5 py-3 text-sm text-[#94A3B8]">
                No opponent decks found.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
