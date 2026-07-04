import fs from "fs";
import path from "path";
import os from "os";
import { ClassicLevel } from "classic-level";

const ORIGIN = process.env.SHEET_ORIGIN ?? "dt-prime.vercel.app";
const STORAGE_KEY = "product-card-template-v4";

const DEFAULT_ROOTS = [
  {
    label: "chrome",
    path: path.join(
      os.homedir(),
      "AppData/Local/Google/Chrome/User Data/Default/Local Storage/leveldb"
    ),
  },
  {
    label: "edge",
    path: path.join(
      os.homedir(),
      "AppData/Local/Microsoft/Edge/User Data/Default/Local Storage/leveldb"
    ),
  },
  {
    label: "cursor",
    path: path.join(
      os.homedir(),
      "AppData/Roaming/Cursor/Partitions/cursor-browser/Local Storage/leveldb"
    ),
  },
];

function parseJsonValue(buf) {
  const attempts = [];
  if (buf[0] === 0x01) attempts.push(buf.subarray(1));
  attempts.push(buf);

  for (const body of attempts) {
    for (const align of [0, 1]) {
      const slice = body.subarray(align);
      const text = slice.toString("utf16le");
      const start = text.indexOf('{"cards"');
      if (start < 0) continue;

      let depth = 0;
      let inStr = false;
      let esc = false;
      for (let i = start; i < text.length; i++) {
        const c = text[i];
        if (inStr) {
          if (esc) esc = false;
          else if (c === "\\") esc = true;
          else if (c === '"') inStr = false;
          continue;
        }
        if (c === '"') {
          inStr = true;
          continue;
        }
        if (c === "{") depth++;
        else if (c === "}") {
          depth--;
          if (depth === 0) {
            try {
              const data = JSON.parse(text.slice(start, i + 1));
              if (data?.cards?.length) return data;
            } catch {
              /* try next */
            }
          }
        }
      }
    }
  }
  return null;
}

async function readLevelDb(srcRoot) {
  const tmp = path.join(
    process.cwd(),
    `.tmp-leveldb-${path.basename(srcRoot)}-${Date.now()}`
  );
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.mkdirSync(tmp, { recursive: true });

  for (const name of fs.readdirSync(srcRoot)) {
    fs.copyFileSync(path.join(srcRoot, name), path.join(tmp, name));
  }

  const db = new ClassicLevel(tmp, {
    create: false,
    keyEncoding: "buffer",
    valueEncoding: "buffer",
  });

  const hits = [];
  await db.open();
  try {
    for await (const [k, v] of db.iterator()) {
      const ks = k.toString("utf8");
      if (!ks.includes(STORAGE_KEY)) continue;
      const originMatch = ks.includes(ORIGIN);
      const data = parseJsonValue(v);
      if (!data) continue;
      hits.push({ originMatch, cards: data.cards.length, data, key: ks });
    }
  } finally {
    await db.close();
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  return hits;
}

const roots = process.env.SHEET_LEVELDB
  ? [{ label: "custom", path: process.env.SHEET_LEVELDB }]
  : DEFAULT_ROOTS;

const allHits = [];
for (const root of roots) {
  if (!fs.existsSync(root.path)) continue;
  const hits = await readLevelDb(root.path);
  for (const hit of hits) {
    allHits.push({ ...hit, root: root.label });
  }
}

if (!allHits.length) {
  console.error(`not found (origin=${ORIGIN})`);
  process.exit(1);
}

allHits.sort((a, b) => {
  if (a.originMatch !== b.originMatch) return a.originMatch ? -1 : 1;
  return b.cards - a.cards;
});

const best = allHits[0];
const out = path.join(process.cwd(), "scripts", "_sheet-state-snapshot.json");
fs.writeFileSync(out, JSON.stringify(best.data, null, 2), "utf8");

console.log("saved", out);
console.log("root:", best.root);
console.log("origin match:", best.originMatch);
console.log("key:", best.key.slice(0, 120));
console.log("cards:", best.data.cards.length);
console.log("presets:", best.data.presets?.length ?? 0);
console.log("brandStyles:", Object.keys(best.data.brandStyles ?? {}).length);
console.log("cardStyles:", Object.keys(best.data.cardStyles ?? {}).length);
