"use client";

import { useEffect, useMemo, useState } from "react";
import { ArchetypeSprites } from "@/components/ArchetypeSprites";
import { inputH10, label as labelClass } from "@/components/brand-styles";

type ArchetypePickerProps = {
  id: string;
  name: string;
  label: string;
  options: string[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  required?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
  maxOptions?: number;
  listMaxHeightClassName?: string;
};

function normalize(value: string) {
  return value
    .trim()
    .replace(/[’‘`]/g, "'")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function ArchetypePicker({
  id,
  name,
  label,
  options,
  value,
  defaultValue = "",
  onValueChange,
  required = false,
  autoFocus = false,
  placeholder = "Search or type an archetype",
  maxOptions = 12,
  listMaxHeightClassName = "max-h-72",
}: ArchetypePickerProps) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const selectedValue = isControlled ? value : internalValue;
  const [query, setQuery] = useState(selectedValue ?? "");

  useEffect(() => {
    if (selectedValue !== query) {
      setQuery(selectedValue ?? "");
    }
    // Query intentionally excluded so typing does not get reset mid-edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedValue]);

  const visibleOptions = useMemo(() => {
    const normalizedQuery = normalize(query);

    if (!normalizedQuery) {
      return options.slice(0, maxOptions);
    }

    return options
      .filter((option) => normalize(option).includes(normalizedQuery))
      .slice(0, maxOptions);
  }, [maxOptions, options, query]);

  const exactMatch = options.some((option) => normalize(option) === normalize(query));
  const canUseCustom = query.trim().length > 0 && !exactMatch;

  function setValue(nextValue: string) {
    if (!isControlled) {
      setInternalValue(nextValue);
    }

    setQuery(nextValue);
    onValueChange?.(nextValue);
  }

  return (
    <div className="flex w-full max-w-full min-w-0 flex-col gap-2 overflow-x-hidden">
      <label htmlFor={`${id}-search`} className={labelClass}>
        {label}
      </label>
      <input
        type="hidden"
        id={id}
        name={name}
        value={selectedValue}
      />
      <input
        id={`${id}-search`}
        type="search"
        value={query}
        required={required}
        autoFocus={autoFocus}
        autoComplete="off"
        inputMode="search"
        placeholder={placeholder}
        onChange={(event) => {
          const nextValue = event.target.value;

          if (!isControlled) {
            setInternalValue(nextValue);
          }

          setQuery(nextValue);
          onValueChange?.(nextValue);
        }}
        className={inputH10}
      />
      <div className={`${listMaxHeightClassName} max-w-full overflow-x-hidden overflow-y-auto rounded-md bg-[#0B1020]/42 p-1.5 shadow-[inset_0_0_0_1px_rgba(248,250,252,0.05)]`}>
        <div className="grid gap-1.5">
          {visibleOptions.map((option) => {
            const isSelected = normalize(option) === normalize(selectedValue);

            return (
              <button
                key={option}
                type="button"
                onClick={() => setValue(option)}
                className={`flex min-h-11 w-full max-w-full min-w-0 items-center gap-3 rounded-md px-2.5 py-2 text-left transition ${
                  isSelected
                    ? "bg-[#4F8CFF]/22 text-[#F8FAFC] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.28)]"
                    : "text-[#94A3B8] hover:bg-[#1A2238]/58 hover:text-[#F8FAFC]"
                }`}
              >
                <ArchetypeSprites archetype={option} className="shrink-0" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {option}
                </span>
              </button>
            );
          })}

          {canUseCustom ? (
            <button
              type="button"
              onClick={() => setValue(query.trim())}
              className="flex min-h-11 w-full max-w-full min-w-0 items-center gap-3 rounded-md px-2.5 py-2 text-left text-[#F8FAFC] transition hover:bg-[#1A2238]/58"
            >
              <ArchetypeSprites archetype={query.trim()} className="shrink-0" />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                Use &quot;{query.trim()}&quot;
              </span>
            </button>
          ) : null}

          {!visibleOptions.length && !canUseCustom ? (
            <p className="px-2.5 py-3 text-sm text-[#94A3B8]">
              No archetypes found.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
