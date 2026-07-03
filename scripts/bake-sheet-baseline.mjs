import fs from "fs";
import path from "path";

const snapshotPath = path.join(process.cwd(), "scripts", "_sheet-state-snapshot.json");
const snapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));

const style = snapshot.globalStyle;
const omitStyle = ["topLineHeight", "thickTopLineHeight"];
const styleEntries = Object.entries(style).filter(([k]) => !omitStyle.includes(k));

function cardToTs(card, indent = "  ") {
  const lines = [`${indent}{`];
  const fields = [
    ["brand", card.brand],
    ["line", card.line],
    ["title", card.title],
    ["highlight", card.highlight],
    ["tags", card.tags],
    ["bottom", card.bottom],
    ["price", card.price],
    ["color", card.color],
  ];
  for (const [key, val] of fields) {
    if (val === undefined || val === null) continue;
    if (
      key === "title" ||
      key === "highlight" ||
      key === "line" ||
      key === "bottom" ||
      key === "price" ||
      key === "brand"
    ) {
      lines.push(`${indent}  ${key}: ${JSON.stringify(val ?? "")},`);
      continue;
    }
    if (key === "tags" && Array.isArray(val)) {
      lines.push(`${indent}  tags: ${JSON.stringify(val)},`);
    } else if (key === "color") {
      lines.push(`${indent}  color: ${JSON.stringify(val)},`);
    } else if (typeof val === "string") {
      lines.push(`${indent}  ${key}: ${JSON.stringify(val)},`);
    }
  }
  lines.push(`${indent}},`);
  return lines.join("\n");
}

const cardsTs = snapshot.cards
  .map((c) => {
    const { id, ...rest } = c;
    return cardToTs(rest);
  })
  .join("\n");

const initialData = `import { ProductSheetCardData, ProductSheetCardInput } from "./types";

function withIds(items: ProductSheetCardInput[]): ProductSheetCardData[] {
  return items.map((item, i) => ({ id: \`sheet-\${i + 1}\`, ...item }));
}

/** 브라우저에 저장된 시트 데이터 기준 (자동 생성 — scripts/bake-sheet-baseline.mjs) */
const RAW: ProductSheetCardInput[] = [
${cardsTs}
];

export const INITIAL_PRODUCT_SHEET_CARDS = withIds(RAW);

export const PRODUCT_SHEET_CARD_COUNT = INITIAL_PRODUCT_SHEET_CARDS.length;
`;

const styleLines = styleEntries
  .map(([k, v]) => {
    if (typeof v === "string") return `    ${k}: ${JSON.stringify(v)},`;
    if (typeof v === "boolean") return `    ${k}: ${v},`;
    return `    ${k}: ${v},`;
  })
  .join("\n");

const stylesPath = path.join(process.cwd(), "lib", "product-sheet", "styles.ts");
let stylesSrc = fs.readFileSync(stylesPath, "utf8");
const fnStart = stylesSrc.indexOf("export function createDefaultSheetStyle()");
const bodyStart = stylesSrc.indexOf("return {", fnStart);
const fnEnd = stylesSrc.indexOf("\nexport function mergeSheetStyle", fnStart);
if (bodyStart < 0 || fnEnd < 0) {
  throw new Error("Could not locate createDefaultSheetStyle() in styles.ts");
}
const newBody = `return {
${styleLines}
    topLineHeight: 2,
    thickTopLineHeight: 3,
  };
}`;
stylesSrc = stylesSrc.slice(0, bodyStart) + newBody + stylesSrc.slice(fnEnd);

function emitStylePatchRecord(obj) {
  const entries = Object.entries(obj ?? {});
  if (entries.length === 0) return "{}";
  const lines = entries.map(
    ([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v, null, 2).replace(/\n/g, "\n  ")} as ProductSheetStyleConfig`
  );
  return `{\n${lines.join(",\n")}\n}`;
}

const bakedState = `import { ProductSheetPreset } from "./presets";
import { ProductSheetStyleConfig } from "./styles";

/** 자동 생성 — scripts/bake-sheet-baseline.mjs */

export const INITIAL_BRAND_STYLES: Record<string, ProductSheetStyleConfig> = ${emitStylePatchRecord(snapshot.brandStyles)};

export const INITIAL_CARD_STYLES: Record<string, ProductSheetStyleConfig> = ${emitStylePatchRecord(snapshot.cardStyles)};

export const INITIAL_SHEET_PRESETS: ProductSheetPreset[] = ${JSON.stringify(
  snapshot.presets ?? [],
  null,
  2
)};
`;

fs.writeFileSync(path.join(process.cwd(), "lib", "product-sheet", "initial-data.ts"), initialData, "utf8");
fs.writeFileSync(stylesPath, stylesSrc, "utf8");
fs.writeFileSync(
  path.join(process.cwd(), "lib", "product-sheet", "baked-sheet-state.ts"),
  bakedState,
  "utf8"
);

console.log(
  "baked",
  snapshot.cards.length,
  "cards,",
  Object.keys(snapshot.brandStyles ?? {}).length,
  "brand styles,",
  Object.keys(snapshot.cardStyles ?? {}).length,
  "card styles,",
  (snapshot.presets ?? []).length,
  "presets"
);
