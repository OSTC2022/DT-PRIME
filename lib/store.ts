"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { BankCard, ProductItem, ProductTemplate, TextCard, TextCardTemplate } from "./types";
import {
  CardStyleConfig,
  TemplatePreset,
  createAllDefaultStyles,
  createDefaultStyle,
  resolveStyle,
} from "./template-styles";
import { createDefaultTemplateDemos, defaultDemoForTemplate, TemplateDemoData } from "./template-demos";
import { pickBulkStyle, BULK_STYLE_KEYS } from "./template-style-fields";
import { migrateStyleOffsets } from "./template-offset";
import { SAMPLE_BANK_CARDS, SAMPLE_PRODUCTS, SAMPLE_TEXT_CARDS } from "./sample-data";
import { buildCloneName } from "./product-clone";
import { cloneProductItem } from "./product-clone";
import { copyCardStyle, copyTemplateDemo, TemplateCardClone, TrashedTemplateCardClone } from "./template-clones";
import { uid } from "./utils";
import { createDefaultTextCardDemos, resolveTextCardDemo, TextCardDemoData } from "./text-card-demos";
import { DEFAULT_BANK_CARD_DEMO, resolveBankCardDemo, BankCardDemoData } from "./bank-card-demos";
import {
  DEFAULT_SAVED_BRANDS,
  DEFAULT_SAVED_CATEGORIES,
  DEFAULT_SAVED_TAB2,
  addSavedName,
  mergeSavedCatalog,
} from "./saved-labels";
import { PRODUCT_TEMPLATES } from "./templates";
import {
  backupTemplatePresets,
  createPersistStorage,
  resolvePersistedPresets,
} from "./preset-persist";

/**
 * 데이터 계층.
 * 지금은 localStorage(persist)로 저장한다.
 * 추후 Supabase 연결 시: 각 액션 본문을 supabase 호출로 교체하면 된다.
 * (예: addProduct -> await supabase.from('products').insert(...))
 * 컴포넌트는 이 스토어 API만 사용하므로 화면 코드는 그대로 둘 수 있다.
 */

interface AppState {
  products: ProductItem[];
  textCards: TextCard[];
  bankCards: BankCard[];
  templateStyles: Record<string, CardStyleConfig>;
  templateDemos: Record<string, TemplateDemoData>;
  templatePresets: TemplatePreset[];
  templateClones: TemplateCardClone[];
  trashedTemplateClones: TrashedTemplateCardClone[];
  textCardDemos: Record<TextCardTemplate, TextCardDemoData>;
  bankCardDemo: BankCardDemoData;
  defaultTemplateId: ProductTemplate;
  savedBrandNames: string[];
  savedCategoryNames: string[];
  savedTab2Names: string[];
  trashedBrandNames: string[];
  trashedCategoryNames: string[];
  trashedTab2Names: string[];

  // 선택(선택 삭제용)
  selectedProductIds: string[];

  // products
  addProduct: (p: Omit<ProductItem, "id">) => void;
  addProducts: (ps: ProductItem[]) => void;
  cloneProductAfter: (id: string) => void;
  updateProduct: (id: string, patch: Partial<ProductItem>) => void;
  removeProduct: (id: string) => void;
  reorderProducts: (from: number, to: number) => void;
  resetProductOrder: () => void;
  toggleSelect: (id: string, options?: { multi?: boolean }) => void;
  selectAll: (on: boolean) => void;
  removeSelected: () => void;

  // text cards
  addTextCard: (c: Omit<TextCard, "id">) => void;
  updateTextCard: (id: string, patch: Partial<TextCard>) => void;
  removeTextCard: (id: string) => void;

  // bank cards
  addBankCard: (c: Omit<BankCard, "id">) => void;
  updateBankCard: (id: string, patch: Partial<BankCard>) => void;
  removeBankCard: (id: string) => void;

  // template styles
  updateTemplateStyle: (template: string, patch: Partial<CardStyleConfig>) => void;
  syncSelectedTemplateStyles: (templates: ProductTemplate[], patch: Partial<CardStyleConfig>) => void;
  syncAllTemplateStyles: (style: CardStyleConfig) => void;
  resetSelectedTemplateBulkStyles: (templates: ProductTemplate[]) => void;
  updateTemplateDemo: (template: ProductTemplate, patch: Partial<TemplateDemoData>) => void;
  syncSelectedTemplateDemos: (
    templates: ProductTemplate[],
    patch: Pick<Partial<TemplateDemoData>, "brand" | "category" | "tab2">
  ) => void;
  resetTemplateStyle: (template: string) => void;
  resetAllTemplateStyles: () => void;
  saveTemplatePreset: (
    name: string,
    template: string,
    demo?: Partial<ProductItem>,
    category?: string,
    styleSnapshot?: Partial<CardStyleConfig>
  ) => void;
  overwriteTemplatePreset: (
    presetId: string,
    name: string,
    template: string,
    demo?: Partial<ProductItem>,
    category?: string,
    styleSnapshot?: Partial<CardStyleConfig>
  ) => void;
  loadTemplatePreset: (presetId: string) => void;
  removeTemplatePreset: (presetId: string) => void;
  setDefaultTemplate: (template: ProductTemplate) => void;
  cloneTemplateCardAfter: (ref: { templateId: ProductTemplate } | { cloneId: string }) => string | null;
  updateTemplateClone: (
    id: string,
    patch: {
      label?: string;
      demo?: Partial<TemplateDemoData>;
      style?: Partial<CardStyleConfig>;
    }
  ) => void;
  removeTemplateClone: (id: string) => void;
  trashTemplateClone: (id: string) => void;
  restoreTemplateClone: (id: string) => void;
  purgeTemplateClone: (id: string) => void;
  updateTextCardDemo: (template: TextCardTemplate, patch: Partial<TextCardDemoData>) => void;
  updateBankCardDemo: (patch: Partial<BankCardDemoData>) => void;
  saveBrandName: (name: string) => void;
  saveCategoryName: (name: string) => void;
  saveTab2Name: (name: string) => void;
  removeSavedBrandName: (name: string) => void;
  removeSavedCategoryName: (name: string) => void;
  removeSavedTab2Name: (name: string) => void;
  restoreSavedBrandName: (name: string) => void;
  restoreSavedCategoryName: (name: string) => void;
  restoreSavedTab2Name: (name: string) => void;

  loadSamples: () => void;
  clearAll: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      products: SAMPLE_PRODUCTS,
      textCards: SAMPLE_TEXT_CARDS,
      bankCards: SAMPLE_BANK_CARDS,
      templateStyles: createAllDefaultStyles(),
      templateDemos: createDefaultTemplateDemos(),
      templatePresets: [],
      templateClones: [],
      trashedTemplateClones: [],
      textCardDemos: createDefaultTextCardDemos(),
      bankCardDemo: DEFAULT_BANK_CARD_DEMO,
      defaultTemplateId: "basic",
      savedBrandNames: [...DEFAULT_SAVED_BRANDS],
      savedCategoryNames: [...DEFAULT_SAVED_CATEGORIES],
      savedTab2Names: [...DEFAULT_SAVED_TAB2],
      trashedBrandNames: [],
      trashedCategoryNames: [],
      trashedTab2Names: [],
      selectedProductIds: [],

      addProduct: (p) =>
        set((s) => ({ products: [{ ...p, id: uid("p") }, ...s.products] })),
      addProducts: (ps) => set((s) => ({ products: [...ps, ...s.products] })),
      cloneProductAfter: (id) =>
        set((s) => {
          const index = s.products.findIndex((p) => p.id === id);
          if (index === -1) return s;
          const source = s.products[index];
          const clone = { ...cloneProductItem(s.products, source), id: uid("p") };
          const next = [...s.products];
          next.splice(index + 1, 0, clone);
          return { products: next };
        }),
      updateProduct: (id, patch) =>
        set((s) => ({
          products: s.products.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),
      removeProduct: (id) =>
        set((s) => ({
          products: s.products.filter((p) => p.id !== id),
          selectedProductIds: s.selectedProductIds.filter((x) => x !== id),
        })),
      reorderProducts: (from, to) =>
        set((s) => {
          const next = [...s.products];
          const [moved] = next.splice(from, 1);
          next.splice(to, 0, moved);
          return { products: next };
        }),
      resetProductOrder: () =>
        set((s) => ({
          products: [...s.products].sort((a, b) => a.name.localeCompare(b.name, "ko")),
        })),
      toggleSelect: (id, options) =>
        set((s) => {
          if (options?.multi) {
            return {
              selectedProductIds: s.selectedProductIds.includes(id)
                ? s.selectedProductIds.filter((x) => x !== id)
                : [...s.selectedProductIds, id],
            };
          }
          return {
            selectedProductIds: s.selectedProductIds.includes(id)
              ? s.selectedProductIds.filter((x) => x !== id)
              : [...s.selectedProductIds, id],
          };
        }),
      selectAll: (on) =>
        set((s) => ({ selectedProductIds: on ? s.products.map((p) => p.id) : [] })),
      removeSelected: () =>
        set((s) => ({
          products: s.products.filter((p) => !s.selectedProductIds.includes(p.id)),
          selectedProductIds: [],
        })),

      addTextCard: (c) =>
        set((s) => ({ textCards: [{ ...c, id: uid("t") }, ...s.textCards] })),
      updateTextCard: (id, patch) =>
        set((s) => ({
          textCards: s.textCards.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),
      removeTextCard: (id) =>
        set((s) => ({ textCards: s.textCards.filter((c) => c.id !== id) })),

      addBankCard: (c) =>
        set((s) => ({ bankCards: [{ ...c, id: uid("b") }, ...s.bankCards] })),
      updateBankCard: (id, patch) =>
        set((s) => ({
          bankCards: s.bankCards.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),
      removeBankCard: (id) =>
        set((s) => ({ bankCards: s.bankCards.filter((c) => c.id !== id) })),

      updateTemplateStyle: (template, patch) =>
        set((s) => {
          const current = s.templateStyles[template] ?? createAllDefaultStyles()[template as keyof ReturnType<typeof createAllDefaultStyles>];
          if (!current) return s;
          return {
            templateStyles: {
              ...s.templateStyles,
              [template]: { ...current, ...patch },
            },
          };
        }),
      syncAllTemplateStyles: (style) =>
        set((s) => {
          const next = { ...s.templateStyles };
          for (const t of Object.keys(next)) {
            next[t] = { ...style };
          }
          return { templateStyles: next };
        }),
      syncSelectedTemplateStyles: (templates, patch) =>
        set((s) => {
          const bulkPatch = pickBulkStyle(patch);
          if (Object.keys(bulkPatch).length === 0 || templates.length === 0) return s;
          const next = { ...s.templateStyles };
          const defaults = createAllDefaultStyles();
          for (const t of templates) {
            const current = next[t] ?? defaults[t];
            next[t] = { ...current, ...bulkPatch };
          }
          return { templateStyles: next };
        }),
      resetSelectedTemplateBulkStyles: (templates) =>
        set((s) => {
          if (templates.length === 0) return s;
          const defaults = createAllDefaultStyles();
          const next = { ...s.templateStyles };
          for (const t of templates) {
            const current = next[t] ?? defaults[t];
            const def = defaults[t];
            const bulkPatch = Object.fromEntries(
              BULK_STYLE_KEYS.map((k) => [k, def[k]])
            ) as Partial<CardStyleConfig>;
            next[t] = { ...current, ...bulkPatch };
          }
          return { templateStyles: next };
        }),
      updateTemplateDemo: (template, patch) =>
        set((s) => {
          const defaults = createDefaultTemplateDemos();
          const current = s.templateDemos[template] ?? defaults[template];
          return {
            templateDemos: {
              ...s.templateDemos,
              [template]: { ...current, ...patch },
            },
          };
        }),
      syncSelectedTemplateDemos: (templates, patch) =>
        set((s) => {
          if (templates.length === 0) return s;
          const defaults = createDefaultTemplateDemos();
          const next = { ...s.templateDemos };
          for (const t of templates) {
            const current = next[t] ?? defaults[t];
            next[t] = { ...current, ...patch };
          }
          return { templateDemos: next };
        }),
      resetTemplateStyle: (template) =>
        set((s) => ({
          templateStyles: {
            ...s.templateStyles,
            [template]: createAllDefaultStyles()[template as keyof ReturnType<typeof createAllDefaultStyles>],
          },
        })),
      resetAllTemplateStyles: () =>
        set(() => ({ templateStyles: createAllDefaultStyles() })),
      saveTemplatePreset: (name, template, demo, category, styleSnapshot) =>
        set((s) => {
          const templateKey = template as ProductTemplate;
          const resolved = migrateStyleOffsets(
            resolveStyle(templateKey, styleSnapshot ?? s.templateStyles[template])
          );
          const preset: TemplatePreset = {
            id: uid("preset"),
            name: name.trim() || "저장 프리셋",
            category: category?.trim() || demo?.category?.trim() || "미분류",
            templateType: templateKey,
            style: resolved,
            demo: demo ? { ...demo, cardColor: resolved.accentColor } : undefined,
            savedAt: new Date().toISOString(),
          };
          const templatePresets = [preset, ...s.templatePresets];
          backupTemplatePresets(templatePresets);
          return { templatePresets };
        }),
      overwriteTemplatePreset: (presetId, name, template, demo, category, styleSnapshot) =>
        set((s) => {
          const existing = s.templatePresets.find((p) => p.id === presetId);
          if (!existing) return s;
          const templateKey = template as ProductTemplate;
          const resolved = migrateStyleOffsets(
            resolveStyle(templateKey, styleSnapshot ?? s.templateStyles[template])
          );
          const updated: TemplatePreset = {
            ...existing,
            name: name.trim() || existing.name,
            category: category?.trim() || demo?.category?.trim() || existing.category,
            templateType: templateKey,
            style: resolved,
            demo: demo ? { ...demo, cardColor: resolved.accentColor } : undefined,
            savedAt: new Date().toISOString(),
          };
          const templatePresets = [updated, ...s.templatePresets.filter((p) => p.id !== presetId)];
          backupTemplatePresets(templatePresets);
          return { templatePresets };
        }),
      loadTemplatePreset: (presetId) =>
        set((s) => {
          const preset = s.templatePresets.find((p) => p.id === presetId);
          if (!preset) return s;
          const resolved = migrateStyleOffsets(
            resolveStyle(preset.templateType, preset.style)
          );
          return {
            templateStyles: {
              ...s.templateStyles,
              [preset.templateType]: resolved,
            },
          };
        }),
      removeTemplatePreset: (presetId) =>
        set((s) => {
          const templatePresets = s.templatePresets.filter((p) => p.id !== presetId);
          backupTemplatePresets(templatePresets);
          return { templatePresets };
        }),
      setDefaultTemplate: (template) => set({ defaultTemplateId: template }),

      cloneTemplateCardAfter: (ref) => {
        let createdLabel: string | null = null;
        set((s) => {
          let templateId: ProductTemplate;
          let sourceLabel: string;
          let sourceDemo: TemplateDemoData;
          let sourceStyle: CardStyleConfig;
          let newSortOrder: number;

          if ("cloneId" in ref) {
            const source = s.templateClones.find((c) => c.id === ref.cloneId);
            if (!source) return s;
            templateId = source.sourceTemplateId;
            sourceLabel = source.label;
            sourceDemo = source.demo;
            sourceStyle = source.style;
            newSortOrder = source.sortOrder + 1;
          } else {
            templateId = ref.templateId;
            const meta = PRODUCT_TEMPLATES.find((t) => t.id === templateId);
            sourceLabel = meta?.label ?? templateId;
            sourceDemo = s.templateDemos[templateId] ?? defaultDemoForTemplate(templateId);
            sourceStyle = s.templateStyles[templateId] ?? createDefaultStyle(templateId);
            newSortOrder = 0;
          }

          const allLabels = [
            ...PRODUCT_TEMPLATES.map((t) => t.label),
            ...s.templateClones.map((c) => c.label),
          ];
          const allDemoNames = [
            ...Object.values(s.templateDemos).map((d) => d.name),
            ...s.templateClones.map((c) => c.demo.name),
          ];

          const newLabel = buildCloneName(allLabels, sourceLabel);
          const newDemoName = buildCloneName(allDemoNames, sourceDemo.name);
          createdLabel = newLabel;

          const bumped = s.templateClones.map((c) => {
            if (c.sourceTemplateId !== templateId || c.sortOrder < newSortOrder) return c;
            return { ...c, sortOrder: c.sortOrder + 1 };
          });

          const newClone: TemplateCardClone = {
            id: uid("tc"),
            sourceTemplateId: templateId,
            label: newLabel,
            demo: { ...copyTemplateDemo(sourceDemo), name: newDemoName },
            style: copyCardStyle(sourceStyle),
            sortOrder: newSortOrder,
          };

          return { templateClones: [...bumped, newClone] };
        });
        return createdLabel;
      },

      updateTemplateClone: (id, patch) =>
        set((s) => ({
          templateClones: s.templateClones.map((c) => {
            if (c.id !== id) return c;
            return {
              ...c,
              ...patch,
              demo: patch.demo ? { ...c.demo, ...patch.demo } : c.demo,
              style: patch.style ? { ...c.style, ...patch.style } : c.style,
            };
          }),
        })),

      removeTemplateClone: (id) =>
        set((s) => ({
          templateClones: s.templateClones.filter((c) => c.id !== id),
        })),

      trashTemplateClone: (id) =>
        set((s) => {
          const item = s.templateClones.find((c) => c.id === id);
          if (!item) return s;
          return {
            templateClones: s.templateClones.filter((c) => c.id !== id),
            trashedTemplateClones: [
              { ...item, deletedAt: new Date().toISOString() },
              ...s.trashedTemplateClones,
            ],
          };
        }),

      restoreTemplateClone: (id) =>
        set((s) => {
          const item = s.trashedTemplateClones.find((c) => c.id === id);
          if (!item) return s;
          const { deletedAt: _removed, ...clone } = item;
          return {
            trashedTemplateClones: s.trashedTemplateClones.filter((c) => c.id !== id),
            templateClones: [...s.templateClones, clone],
          };
        }),

      purgeTemplateClone: (id) =>
        set((s) => ({
          trashedTemplateClones: s.trashedTemplateClones.filter((c) => c.id !== id),
        })),

      updateTextCardDemo: (template, patch) =>
        set((s) => {
          const current = s.textCardDemos[template];
          return {
            textCardDemos: {
              ...s.textCardDemos,
              [template]: resolveTextCardDemo(template, { ...current, ...patch }),
            },
          };
        }),

      updateBankCardDemo: (patch) =>
        set((s) => ({
          bankCardDemo: resolveBankCardDemo({ ...s.bankCardDemo, ...patch }),
        })),

      saveBrandName: (name) =>
        set((s) => ({
          savedBrandNames: addSavedName(s.savedBrandNames, name),
          trashedBrandNames: s.trashedBrandNames.filter((n) => n !== name.trim()),
        })),

      saveCategoryName: (name) =>
        set((s) => ({
          savedCategoryNames: addSavedName(s.savedCategoryNames, name),
          trashedCategoryNames: s.trashedCategoryNames.filter((n) => n !== name.trim()),
        })),

      saveTab2Name: (name) =>
        set((s) => ({
          savedTab2Names: addSavedName(s.savedTab2Names, name),
          trashedTab2Names: s.trashedTab2Names.filter((n) => n !== name.trim()),
        })),

      removeSavedBrandName: (name) =>
        set((s) => ({
          savedBrandNames: s.savedBrandNames.filter((n) => n !== name),
          trashedBrandNames: s.trashedBrandNames.includes(name)
            ? s.trashedBrandNames
            : [name, ...s.trashedBrandNames],
        })),

      removeSavedCategoryName: (name) =>
        set((s) => ({
          savedCategoryNames: s.savedCategoryNames.filter((n) => n !== name),
          trashedCategoryNames: s.trashedCategoryNames.includes(name)
            ? s.trashedCategoryNames
            : [name, ...s.trashedCategoryNames],
        })),

      removeSavedTab2Name: (name) =>
        set((s) => ({
          savedTab2Names: s.savedTab2Names.filter((n) => n !== name),
          trashedTab2Names: s.trashedTab2Names.includes(name)
            ? s.trashedTab2Names
            : [name, ...s.trashedTab2Names],
        })),

      restoreSavedBrandName: (name) =>
        set((s) => ({
          savedBrandNames: mergeSavedCatalog(
            s.savedBrandNames.includes(name) ? s.savedBrandNames : [...s.savedBrandNames, name],
            DEFAULT_SAVED_BRANDS
          ),
          trashedBrandNames: s.trashedBrandNames.filter((n) => n !== name),
        })),

      restoreSavedCategoryName: (name) =>
        set((s) => ({
          savedCategoryNames: mergeSavedCatalog(
            s.savedCategoryNames.includes(name) ? s.savedCategoryNames : [...s.savedCategoryNames, name],
            DEFAULT_SAVED_CATEGORIES
          ),
          trashedCategoryNames: s.trashedCategoryNames.filter((n) => n !== name),
        })),

      restoreSavedTab2Name: (name) =>
        set((s) => ({
          savedTab2Names: mergeSavedCatalog(
            s.savedTab2Names.includes(name) ? s.savedTab2Names : [...s.savedTab2Names, name],
            DEFAULT_SAVED_TAB2
          ),
          trashedTab2Names: s.trashedTab2Names.filter((n) => n !== name),
        })),

      loadSamples: () =>
        set(() => ({
          products: SAMPLE_PRODUCTS,
          textCards: SAMPLE_TEXT_CARDS,
          bankCards: SAMPLE_BANK_CARDS,
          selectedProductIds: [],
        })),
      clearAll: () =>
        set(() => ({ products: [], textCards: [], bankCards: [], selectedProductIds: [] })),
    }),
    {
      name: "price-card-store",
      version: 18,
      storage: createJSONStorage(() => createPersistStorage()),
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        if (state?.templatePresets?.length) {
          backupTemplatePresets(state.templatePresets);
        }
      },
      migrate: (persisted) => {
        const p = (persisted ?? {}) as Partial<AppState>;
        return {
          ...p,
          templatePresets: resolvePersistedPresets(p.templatePresets),
        };
      },
      merge: (persisted, current) => {
        const p = persisted as Partial<typeof current>;
        return {
          ...current,
          ...p,
          templateStyles: Object.fromEntries(
            Object.entries({
              ...createAllDefaultStyles(),
              ...(p.templateStyles ?? {}),
            }).map(([k, v]) => [
              k,
              migrateStyleOffsets(resolveStyle(k as ProductTemplate, v as CardStyleConfig)),
            ])
          ) as typeof createAllDefaultStyles extends () => infer R ? R : never,
          templateDemos: {
            ...createDefaultTemplateDemos(),
            ...(p.templateDemos ?? {}),
          },
          templatePresets: resolvePersistedPresets(p.templatePresets),
          templateClones: p.templateClones ?? [],
          trashedTemplateClones: p.trashedTemplateClones ?? [],
          textCardDemos: Object.fromEntries(
            (["sky", "yellow", "rounded", "outline"] as TextCardTemplate[]).map((t) => [
              t,
              resolveTextCardDemo(t, p.textCardDemos?.[t]),
            ])
          ) as Record<TextCardTemplate, TextCardDemoData>,
          bankCardDemo: resolveBankCardDemo(p.bankCardDemo),
          savedBrandNames: mergeSavedCatalog(p.savedBrandNames, DEFAULT_SAVED_BRANDS),
          savedCategoryNames: mergeSavedCatalog(p.savedCategoryNames, DEFAULT_SAVED_CATEGORIES),
          savedTab2Names: mergeSavedCatalog(p.savedTab2Names, DEFAULT_SAVED_TAB2),
          trashedBrandNames: p.trashedBrandNames ?? [],
          trashedCategoryNames: p.trashedCategoryNames ?? [],
          trashedTab2Names: p.trashedTab2Names ?? [],
          defaultTemplateId: p.defaultTemplateId ?? "basic",
        };
      },
    }
  )
);
