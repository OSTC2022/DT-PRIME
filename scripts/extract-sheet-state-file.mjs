import fs from "fs";
import path from "path";

const file = process.argv[2];
if (!file) {
  console.error("usage: node scripts/extract-sheet-state-file.mjs <path-to-ldb>");
  process.exit(1);
}

const KEY = Buffer.from("product-sheet-state-v2", "utf8");
const JSON_START = Buffer.from('{"cards"', "utf16le");

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

const buf = fs.readFileSync(file);
if (!buf.includes(KEY)) {
  console.error("key not in file");
  process.exit(1);
}

let searchFrom = 0;
while (searchFrom < buf.length) {
  const jsonIdx = buf.indexOf(JSON_START, searchFrom);
  if (jsonIdx < 0) break;
  const data = parseJsonFromUtf16(buf.subarray(jsonIdx).toString("utf16le"));
  if (data?.cards?.length) {
    const out = path.join(process.cwd(), "scripts", "_sheet-state-snapshot.json");
    fs.writeFileSync(out, JSON.stringify(data, null, 2), "utf8");
    console.log("saved", out);
    console.log("cards:", data.cards.length);
    process.exit(0);
  }
  searchFrom = jsonIdx + 2;
}

console.error("parse failed");
process.exit(1);
