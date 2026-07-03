import fs from "fs";
import path from "path";
import os from "os";

const LEVELDB = path.join(
  os.homedir(),
  "AppData/Roaming/Cursor/Partitions/cursor-browser/Local Storage/leveldb"
);

function parseJsonFromUtf16(text) {
  const start = text.indexOf("{");
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
        return JSON.parse(text.slice(start, i + 1));
      }
    }
  }
  return null;
}

function extractFromBuffer(buf) {
  const key = Buffer.from("product-sheet-state-v2", "utf8");
  const idx = buf.indexOf(key);
  if (idx < 0) return null;
  for (const off of [0, 1, 2, 4, 8, 16, 24, 31, 32, 40, 48, 56, 64]) {
    const text = buf.subarray(idx + key.length + off).toString("utf16le");
    if (!text.includes('"cards"')) continue;
    const data = parseJsonFromUtf16(text);
    if (data?.cards?.length) return data;
  }
  return null;
}

const files = fs
  .readdirSync(LEVELDB)
  .filter((f) => f.endsWith(".ldb") || f.endsWith(".log"))
  .map((f) => ({ f, mtime: fs.statSync(path.join(LEVELDB, f)).mtimeMs }))
  .sort((a, b) => b.mtime - a.mtime);

for (const { f } of files) {
  const data = extractFromBuffer(fs.readFileSync(path.join(LEVELDB, f)));
  if (data) {
    const out = path.join(process.cwd(), "scripts", "_sheet-state-snapshot.json");
    fs.writeFileSync(out, JSON.stringify(data, null, 2), "utf8");
    console.log("saved", out);
    console.log("cards:", data.cards.length);
    console.log("presets:", data.presets?.length ?? 0);
    console.log("brandStyles:", Object.keys(data.brandStyles ?? {}).length);
    process.exit(0);
  }
}

console.error("not found");
process.exit(1);
