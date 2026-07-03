import { TemplatePreset, resolveStyle } from "./template-styles";
import { ProductTemplate } from "./types";
import { migrateStyleOffsets } from "./template-offset";
import type { StateStorage } from "zustand/middleware";

export const PRESETS_BACKUP_KEY = "price-card-presets-backup";

/** localStorage 복원 전 빈 상태가 덮어쓰지 않도록 보호 */
export function createPersistStorage(): StateStorage {
  let hydrated = false;

  return {
    getItem: (name: string): string | null => {
      if (typeof window === "undefined") return null;
      hydrated = true;
      return localStorage.getItem(name);
    },
    setItem: (name: string, value: string) => {
      if (typeof window === "undefined" || !hydrated) return;
      try {
        localStorage.setItem(name, value);
      } catch {
        /* quota exceeded — 기존 데이터 유지 */
      }
    },
    removeItem: (name: string) => {
      if (typeof window === "undefined" || !hydrated) return;
      localStorage.removeItem(name);
    },
  };
}

export function normalizeTemplatePresets(raw: unknown): TemplatePreset[] {
  if (!Array.isArray(raw)) return [];
  const out: TemplatePreset[] = [];

  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const preset = item as TemplatePreset;
    if (!preset.id || !preset.templateType || !preset.style) continue;

    try {
      const resolved = migrateStyleOffsets(
        resolveStyle(preset.templateType as ProductTemplate, preset.style)
      );
      out.push({
        ...preset,
        name: preset.name?.trim() || "저장 프리셋",
        category: preset.category?.trim() || preset.demo?.category?.trim() || "미분류",
        style: resolved,
        demo: preset.demo
          ? { ...preset.demo, cardColor: preset.demo.cardColor ?? resolved.accentColor }
          : undefined,
        savedAt: preset.savedAt || new Date().toISOString(),
      });
    } catch {
      out.push(preset);
    }
  }

  return out;
}

export function backupTemplatePresets(presets: TemplatePreset[]) {
  if (typeof window === "undefined" || presets.length === 0) return;
  try {
    localStorage.setItem(PRESETS_BACKUP_KEY, JSON.stringify(presets));
  } catch {
    /* ignore */
  }
}

export function loadTemplatePresetsBackup(): TemplatePreset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PRESETS_BACKUP_KEY);
    if (!raw) return [];
    return normalizeTemplatePresets(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function resolvePersistedPresets(raw: unknown): TemplatePreset[] {
  const fromStore = normalizeTemplatePresets(raw);
  if (fromStore.length > 0) return fromStore;
  return loadTemplatePresetsBackup();
}
