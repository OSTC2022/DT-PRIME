import fs from "fs";
import path from "path";
import os from "os";
import { ClassicLevel } from "classic-level";
import { spawnSync } from "child_process";

const WEB_ORIGIN = "https://dt-prime.vercel.app";
const LOCAL_ORIGINS = ["http://localhost:3000", "http://localhost:3001"];

function extractBalanced(src, openIdx, openCh, closeCh) {
  let depth = 0;
  let inStr = false;
  let quote = "";
  let esc = false;
  for (let i = openIdx; i < src.length; i++) {
    const c = src[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === quote) inStr = false;
      continue;
    }
    if (c === '"' || c === "'") {
      inStr = true;
      quote = c;
      continue;
    }
    if (c === openCh) depth++;
    else if (c === closeCh) {
      depth--;
      if (depth === 0) return src.slice(openIdx, i + 1);
    }
  }
  return null;
}

function jsLiteralToJson(text) {
  return text
    .replace(/!0/g, "true")
    .replace(/!1/g, "false")
    .replace(/([\{\[,]\s*)([^":\{\[\s]+)\s*:/g, (m, pre, key) => {
      if (key === "true" || key === "false" || key === "null" || /^-?\d/.test(key)) return m;
      return `${pre}"${key}":`;
    });
}

function parseJsLiteral(text) {
  return JSON.parse(jsLiteralToJson(text));
}

async function fetchDeployedChunk() {
  const html = await (await fetch(`${WEB_ORIGIN}/product-card-template`)).text();
  const chunk = html.match(/\/_next\/static\/chunks\/app\/product-card-template\/page-[^"]+\.js/)?.[0];
  if (!chunk) throw new Error("배포 페이지 청크를 찾지 못했습니다.");
  return await (await fetch(`${WEB_ORIGIN}${chunk}`)).text();
}

function pullWebState(js) {
  const cardsMarker = js.indexOf('[{brand:"유쏘랩"');
  const cardsArr = extractBalanced(js, cardsMarker, "[", "]");
  const rawCards = parseJsLiteral(cardsArr).map((card, i) => ({
    id: `sheet-${i + 1}`,
    ...card,
  }));

  const brandOpen = js.indexOf("{유쏘랩:{bodyPaddingTop:5");
  const brandStyles = parseJsLiteral(extractBalanced(js, brandOpen, "{", "}"));

  const cardOpen = js.indexOf('{"sheet-32":{height:150}');
  const cardStyles = parseJsLiteral(extractBalanced(js, cardOpen, "{", "}"));

  const presetOpen = js.indexOf('[{id:"sheet-preset_');
  const presets = parseJsLiteral(extractBalanced(js, presetOpen, "[", "]"));

  const globalStyle = { ...(presets[0]?.style ?? {}) };
  if (!globalStyle.width) globalStyle.width = 188;
  if (!globalStyle.height) globalStyle.height = 125;
  if (!globalStyle.cellWidth) globalStyle.cellWidth = 201;
  if (!globalStyle.cellHeight) globalStyle.cellHeight = 147;

  return {
    cards: rawCards,
    globalStyle,
    brandStyles,
    cardStyles,
    presets,
  };
}

function storageKey(origin, key) {
  return Buffer.from(`_${origin}\x00\x01${key}`, "utf8");
}

function encodeStorageValue(json) {
  return Buffer.concat([Buffer.from([0]), Buffer.from(json, "utf16le")]);
}

async function writeLocalStorage(state) {
  const ldb = path.join(
    os.homedir(),
    "AppData/Roaming/Cursor/Partitions/cursor-browser/Local Storage/leveldb"
  );
  if (!fs.existsSync(ldb)) {
    console.warn("Cursor 브라우저 storage 없음 — 코드만 동기화됩니다.");
    return;
  }

  const tmp = path.join(process.cwd(), `.tmp-leveldb-seed-${Date.now()}`);
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.mkdirSync(tmp, { recursive: true });
  for (const name of fs.readdirSync(ldb)) {
    fs.copyFileSync(path.join(ldb, name), path.join(tmp, name));
  }

  const db = new ClassicLevel(tmp, {
    create: false,
    keyEncoding: "buffer",
    valueEncoding: "buffer",
  });

  const raw = JSON.stringify(state);
  const value = encodeStorageValue(raw);

  await db.open();
  try {
    for (const origin of LOCAL_ORIGINS) {
      await db.put(storageKey(origin, "product-sheet-state-v2"), value);
      await db.put(storageKey(origin, "product-sheet-state-v2-backup"), value);
      console.log("seeded", origin);
    }
  } finally {
    await db.close();
  }

  for (const name of fs.readdirSync(tmp)) {
    const src = path.join(tmp, name);
    const dest = path.join(ldb, name);
    try {
      fs.copyFileSync(src, dest);
    } catch {
      console.warn("storage 파일 복사 실패(브라우저를 닫고 다시 실행):", name);
    }
  }
  fs.rmSync(tmp, { recursive: true, force: true });
}

const js = await fetchDeployedChunk();
const state = pullWebState(js);

const snapshotPath = path.join(process.cwd(), "scripts", "_sheet-state-snapshot.json");
fs.writeFileSync(snapshotPath, JSON.stringify(state, null, 2), "utf8");
console.log("snapshot:", snapshotPath);
console.log("cards:", state.cards.length);

const bake = spawnSync(process.execPath, ["scripts/bake-sheet-baseline.mjs"], {
  cwd: process.cwd(),
  stdio: "inherit",
});
if (bake.status !== 0) process.exit(bake.status ?? 1);

await writeLocalStorage(state);

try {
  fs.unlinkSync(snapshotPath);
} catch {
  /* ignore */
}

console.log("완료: 웹(dt-prime) 상태 → 로컬 코드 + localhost storage 반영");
console.log("브라우저에서 http://localhost:3000/product-card-template 새로고침(Ctrl+Shift+R) 하세요.");
