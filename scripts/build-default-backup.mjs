import fs from "fs";
import path from "path";

const snapshotPath = process.argv[2] ?? path.join("scripts", "_sheet-state-snapshot.json");
const snapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));

const backup = {
  version: 4,
  exportedAt: new Date().toISOString(),
  source: "bundled-default",
  storageKey: "product-card-template-v4",
  data: {
    cards: snapshot.cards,
    products: snapshot.cards,
    globalStyle: snapshot.globalStyle,
    globalSettings: snapshot.globalStyle,
    brandStyles: snapshot.brandStyles,
    brandSettings: snapshot.brandStyles,
    cardStyles: snapshot.cardStyles ?? {},
    styles: snapshot.cardStyles ?? {},
    presets: snapshot.presets ?? [],
    ui: snapshot.ui ?? {
      filters: { query: "", brand: "", color: "" },
      selection: [],
      exportScope: "all",
      multiSelectMode: false,
    },
  },
};

const outDir = path.join(process.cwd(), "public");
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, "product-card-template-default.json");
fs.writeFileSync(out, JSON.stringify(backup, null, 2), "utf8");
console.log("wrote", out, "cards:", snapshot.cards.length);
