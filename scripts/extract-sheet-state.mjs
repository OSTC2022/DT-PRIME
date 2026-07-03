import fs from "fs";
import path from "path";
import os from "os";

const KEY = Buffer.from("product-sheet-state-v2", "utf8");
const JSON_START = Buffer.from('{"cards"', "utf16le");

const DEFAULT_ROOTS = [
  path.join(os.homedir(), "AppData/Roaming/Cursor/Partitions/cursor-browser/Local Storage/leveldb"),
  path.join(os.homedir(), "AppData/Local/Google/Chrome/User Data/Default/Local Storage/leveldb"),
  path.join(os.homedir(), "AppData/Local/Microsoft/Edge/User Data/Default/Local Storage/leveldb"),
];

function parseJsonFromUtf16(text) {
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

function extractFromBuffer(buf) {
  if (!buf.includes(KEY)) return null;

  let searchFrom = 0;
  while (searchFrom < buf.length) {
    const jsonIdx = buf.indexOf(JSON_START, searchFrom);
    if (jsonIdx < 0) break;

    const data = parseJsonFromUtf16(buf.subarray(jsonIdx).toString("utf16le"));
    if (data?.cards?.length && data.globalStyle) {
      return data;
    }
    searchFrom = jsonIdx + 2;
  }
  return null;
}

function collectLevelDbFiles(root) {
  if (!fs.existsSync(root)) return [];
  return fs
    .readdirSync(root)
    .filter((f) => f.endsWith(".log") || f.endsWith(".ldb"))
    .map((f) => ({ f, path: path.join(root, f), mtime: fs.statSync(path.join(root, f)).mtimeMs }))
    .sort((a, b) => {
      const logA = a.f.endsWith(".log") ? 1 : 0;
      const logB = b.f.endsWith(".log") ? 1 : 0;
      if (logA !== logB) return logB - logA;
      return b.mtime - a.mtime;
    });
}

const roots = process.env.SHEET_LEVELDB
  ? [process.env.SHEET_LEVELDB]
  : DEFAULT_ROOTS;

for (const root of roots) {
  for (const { path: filePath } of collectLevelDbFiles(root)) {
    let data;
    try {
      data = extractFromBuffer(fs.readFileSync(filePath));
    } catch {
      continue;
    }
    if (!data) continue;

    const out = path.join(process.cwd(), "scripts", "_sheet-state-snapshot.json");
    fs.writeFileSync(out, JSON.stringify(data, null, 2), "utf8");
    console.log("saved", out);
    console.log("source:", filePath);
    console.log("cards:", data.cards.length);
    console.log("presets:", data.presets?.length ?? 0);
    console.log("brandStyles:", Object.keys(data.brandStyles ?? {}).length);
    console.log("cardStyles:", Object.keys(data.cardStyles ?? {}).length);
    process.exit(0);
  }
}

console.error("not found");
process.exit(1);
