import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const refreshDate = new Date().toISOString().slice(0, 10);

const sources = [
  { key: "limitless_decks", url: "https://limitlesstcg.com/decks" },
  { key: "limitless_decklists", url: "https://limitlesstcg.com/decks/lists" },
  { key: "play_limitless_decks", url: "https://play.limitlesstcg.com/decks?game=PTCG" },
];

function decodeHtml(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, "\"")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function cleanText(value) {
  return decodeHtml(value).replace(/\s+/g, " ").trim();
}

function normalizeDeckName(name, annotation = "") {
  const cleanName = cleanText(name);
  const cleanAnnotation = cleanText(annotation);

  if (!cleanName) {
    return null;
  }

  if (
    cleanAnnotation &&
    /^(ex|VSTAR|VMAX)$/i.test(cleanAnnotation) &&
    !new RegExp(`\\b${cleanAnnotation}$`, "i").test(cleanName)
  ) {
    return `${cleanName} ${cleanAnnotation}`;
  }

  return cleanName;
}

function extractLimitlessDeckTable(html) {
  const names = new Set();
  const rowPattern =
    /<td><a href="\/decks\/\d+">([^<]+?)(?:\s*<span class="annotation">([^<]+)<\/span>)?<\/a><\/td>/g;

  for (const match of html.matchAll(rowPattern)) {
    const normalized = normalizeDeckName(match[1] ?? "", match[2] ?? "");

    if (normalized) {
      names.add(normalized);
    }
  }

  return Array.from(names);
}

function extractLimitlessDecklists(html) {
  const names = new Set();
  const rowPattern =
    /<td><a href="\/decks\/list\/\d+">([^<]+?)(?:\s*<span class="annotation">by [^<]+<\/span>)?<\/a><\/td>/g;

  for (const match of html.matchAll(rowPattern)) {
    const normalized = normalizeDeckName(match[1] ?? "");

    if (normalized) {
      names.add(normalized);
    }
  }

  return Array.from(names);
}

function extractPlayLimitlessDecks(html) {
  const names = new Set();
  const rowPattern =
    /<tr[^>]*>\s*<td>\d+<\/td>\s*<td>[\s\S]*?<\/td>\s*<td><a href="\/decks\/[^"?]+(?:\?[^"]*)?">([^<]+)<\/a><\/td>/g;

  for (const match of html.matchAll(rowPattern)) {
    const normalized = normalizeDeckName(match[1] ?? "");

    if (normalized && normalized !== "Other") {
      names.add(normalized);
    }
  }

  return Array.from(names);
}

function extractDeckNames(sourceKey, html) {
  if (sourceKey === "limitless_decks") {
    return extractLimitlessDeckTable(html);
  }

  if (sourceKey === "limitless_decklists") {
    return extractLimitlessDecklists(html);
  }

  return extractPlayLimitlessDecks(html);
}

async function fetchSource(source) {
  const response = await fetch(source.url, {
    headers: {
      "user-agent": "SixPrizer archetype refresh workflow",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${source.url}: ${response.status}`);
  }

  const html = await response.text();

  return {
    ...source,
    deckNames: extractDeckNames(source.key, html),
    fetchedAt: new Date().toISOString(),
  };
}

async function main() {
  const results = [];

  for (const source of sources) {
    const data = await fetchSource(source);
    results.push(data);
  }

  const outputDir = path.resolve("results");
  await mkdir(outputDir, { recursive: true });

  const outputPath = path.join(
    outputDir,
    `archetype_refresh_limitless_${refreshDate}.json`
  );

  await writeFile(
    outputPath,
    JSON.stringify(
      {
        refreshedAt: new Date().toISOString(),
        sources: results,
      },
      null,
      2
    )
  );

  console.log(`Saved archetype refresh snapshot to ${outputPath}`);
  console.log("");
  console.log("Top extracted deck names by source:");

  for (const source of results) {
    console.log(`- ${source.key}:`);
    source.deckNames.slice(0, 20).forEach((name) => {
      console.log(`  - ${name}`);
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
