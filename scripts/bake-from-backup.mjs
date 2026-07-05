import fs from "fs";
import path from "path";

const backupPath = process.argv[2];
if (!backupPath) {
  console.error("usage: node scripts/bake-from-backup.mjs <backup.json>");
  process.exit(1);
}

const backup = JSON.parse(fs.readFileSync(backupPath, "utf8").replace(/^\uFEFF/, ""));
const data = backup.data ?? backup;

if (!Array.isArray(data.cards) || data.cards.length === 0) {
  console.error("backup has no cards");
  process.exit(1);
}

const cardsRaw = data.cards;
const idMap = {};

const cards = cardsRaw.map((card, i) => {
  const newId = `sheet-${i + 1}`;
  if (card.id) idMap[String(card.id)] = newId;
  const { id: _id, ...rest } = card;
  return { id: newId, ...rest };
});

const cardStylesRaw = data.cardStyles ?? data.styles ?? {};
const cardStyles = {};
for (const [oldId, style] of Object.entries(cardStylesRaw)) {
  const newId = idMap[oldId];
  if (newId) cardStyles[newId] = style;
}

const snapshot = {
  cards,
  globalStyle: data.globalStyle ?? data.globalSettings ?? {},
  brandStyles: data.brandStyles ?? data.brandSettings ?? {},
  cardStyles,
  presets: data.presets ?? [],
};

const out = path.join(process.cwd(), "scripts", "_sheet-state-snapshot.json");
fs.writeFileSync(out, JSON.stringify(snapshot, null, 2), "utf8");

console.log("snapshot:", out);
console.log("cards:", snapshot.cards.length);
console.log("first:", snapshot.cards[0]?.highlight ?? snapshot.cards[0]?.title);
console.log("exportedAt:", backup.exportedAt ?? "(unknown)");
