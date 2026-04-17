import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const archetypesPath = path.join(root, "src/lib/archetypes.ts");
const spritesPath = path.join(root, "src/lib/archetype-sprites.ts");
const pokemonPath = path.join(root, "src/lib/pokemon-sprites.ts");
const spriteDir = path.join(root, "public/sprites");

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function extractArray(source, exportName) {
  const match = source.match(
    new RegExp(`export const ${exportName} = \\[([\\s\\S]*?)\\] as const;`)
  );

  if (!match) {
    throw new Error(`Could not find ${exportName}.`);
  }

  return [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1]);
}

function extractSpriteArchetypes(source) {
  return new Set([...source.matchAll(/^\s{2}"([^"]+)":/gm)].map((item) => item[1]));
}

function extractPokemonSpriteFiles(source) {
  return [...source.matchAll(/:\s"([^"]+\.png)"/g)].map((item) => item[1]);
}

const currentArchetypes = extractArray(
  read(archetypesPath),
  "POST_ROTATION_2026_ARCHETYPES"
).filter((archetype) => archetype !== "Other / Emerging");
const spriteArchetypes = extractSpriteArchetypes(read(spritesPath));
const missingMappings = currentArchetypes.filter(
  (archetype) => !spriteArchetypes.has(archetype)
);

if (missingMappings.length) {
  console.error("Missing archetype sprite mappings:");
  console.error(missingMappings.join("\n"));
  process.exit(1);
}

const spriteFiles = extractPokemonSpriteFiles(read(pokemonPath));
const missingFiles = [...new Set(spriteFiles)].filter(
  (filename) => !fs.existsSync(path.join(spriteDir, filename))
);

if (missingFiles.length) {
  console.error("Missing local sprite files:");
  console.error(missingFiles.join("\n"));
  process.exit(1);
}

console.log(
  `Sprite coverage OK: ${currentArchetypes.length} archetypes, ${new Set(spriteFiles).size} Pokemon files.`
);
