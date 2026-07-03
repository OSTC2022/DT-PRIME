import fs from "fs";
import path from "path";
import os from "os";
import { ClassicLevel } from "classic-level";

const src =
  process.env.SHEET_LEVELDB ??
  path.join(
    os.homedir(),
    "AppData/Roaming/Cursor/Partitions/cursor-browser/Local Storage/leveldb"
  );

const tmp = path.join(process.cwd(), ".tmp-leveldb-copy");
fs.rmSync(tmp, { recursive: true, force: true });
fs.mkdirSync(tmp, { recursive: true });
for (const name of fs.readdirSync(src)) {
  fs.copyFileSync(path.join(src, name), path.join(tmp, name));
}

function parseJsonObject(text) {
  const start = text.indexOf('{"cards"');
  if (start < 0) return null;
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
          return JSON.parse(text.slice(start, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

const db = new ClassicLevel(tmp, {
  create: false,
  keyEncoding: "buffer",
  valueEncoding: "buffer",
});

await db.open();

for await (const [k, v] of db.iterator()) {
  const ks = k.toString("utf8");
  if (!ks.includes("product-sheet-state-v2")) continue;

  let body = v;
  if (v[0] === 0x01) body = v.subarray(1);

  const data = parseJsonObject(body.toString("utf16le"));
  if (data?.cards?.length) {
    const out = path.join(process.cwd(), "scripts", "_sheet-state-snapshot.json");
    fs.writeFileSync(out, JSON.stringify(data, null, 2), "utf8");
    console.log("saved", out);
    console.log("cards:", data.cards.length);
    console.log("presets:", data.presets?.length ?? 0);
    console.log("brandStyles:", Object.keys(data.brandStyles ?? {}).length);
    console.log("cardStyles:", Object.keys(data.cardStyles ?? {}).length);
    await db.close();
    fs.rmSync(tmp, { recursive: true, force: true });
    process.exit(0);
  }
}

await db.close();
fs.rmSync(tmp, { recursive: true, force: true });
console.error("not found");
process.exit(1);
