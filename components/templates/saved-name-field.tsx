"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { filterSavedNames } from "@/lib/name-search";
import { cn } from "@/lib/utils";
import { ChevronDown, Plus, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";

function SavedNameCombobox({
  names,
  onPick,
  disabled,
  placeholder = "불러오기",
}: {
  names: string[];
  onPick: (name: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => filterSavedNames(names, query), [names, query]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const pick = (name: string) => {
    onPick(name);
    setQuery("");
    setOpen(false);
  };

  const toggleList = () => {
    if (disabled) return;
    setOpen((v) => !v);
  };

  return (
    <div ref={rootRef} className="relative min-w-0 flex-1">
      <div className="flex">
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={`${placeholder}…`}
          disabled={disabled}
          className="h-9 rounded-r-none border-r-0 pr-2"
          autoComplete="off"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          className="h-9 shrink-0 rounded-l-none px-2"
          onClick={toggleList}
          aria-expanded={open}
          aria-label="목록 펼치기"
        >
          <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
        </Button>
      </div>

      {open ? (
        <ul
          className="absolute z-50 mt-1 max-h-44 w-full overflow-y-auto rounded-md border bg-background py-1 shadow-md"
          role="listbox"
        >
          {filtered.length > 0 ? (
            filtered.map((name) => (
              <li key={name}>
                <button
                  type="button"
                  role="option"
                  className="w-full px-3 py-1.5 text-left text-sm hover:bg-muted"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(name)}
                >
                  {name}
                </button>
              </li>
            ))
          ) : (
            <li className="px-3 py-2 text-[11px] text-muted-foreground">검색 결과가 없어요.</li>
          )}
        </ul>
      ) : null}
    </div>
  );
}

export function SavedNameField({
  label,
  value,
  onChange,
  savedNames,
  trashedNames = [],
  onSave,
  onRemove,
  onRestore,
  placeholder,
  disabled = false,
  selectPlaceholder = "불러오기",
  inputLocked = false,
  lockedHint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  savedNames: string[];
  trashedNames?: string[];
  onSave: (name: string) => void;
  onRemove?: (name: string) => void;
  onRestore?: (name: string) => void;
  placeholder?: string;
  disabled?: boolean;
  selectPlaceholder?: string;
  /** 프리셋 이름 연동 중 — 직접 수정 불가 */
  inputLocked?: boolean;
  lockedHint?: string;
}) {
  const fieldDisabled = disabled || inputLocked;
  const handleSave = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      toast.error("저장할 이름을 입력해 주세요.");
      return;
    }
    if (savedNames.includes(trimmed)) {
      toast.message("이미 저장된 이름이에요.");
      return;
    }
    onSave(trimmed);
    toast.success(`"${trimmed}"을(를) 목록에 저장했어요.`);
  };

  const trimmedValue = value.trim();
  const canRemove = onRemove && trimmedValue && savedNames.includes(trimmedValue);

  const handleRemove = () => {
    if (!onRemove || !trimmedValue) return;
    onRemove(trimmedValue);
    toast.message(`"${trimmedValue}" 삭제 — 아래 목록에서 되돌릴 수 있어요.`);
  };

  const handleRestore = (name: string) => {
    onRestore?.(name);
    toast.success(`"${name}"을(를) 목록에 복원했어요.`);
  };

  return (
    <div>
      {label ? <Label className="text-[11px]">{label}</Label> : null}
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={fieldDisabled}
        className={label ? "mt-0.5" : ""}
      />
      {inputLocked && lockedHint ? (
        <p className="mt-1 text-[10px] text-muted-foreground">{lockedHint}</p>
      ) : null}
      {savedNames.length > 0 ? (
        <div className="mt-2">
          <div className="flex gap-2">
            <SavedNameCombobox
              names={savedNames}
              onPick={onChange}
              disabled={fieldDisabled}
              placeholder={selectPlaceholder}
            />
            {canRemove ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 shrink-0 px-2"
                disabled={fieldDisabled}
                onClick={handleRemove}
                title="목록에서 삭제 (되돌리기 가능)"
              >
                <Trash2 className="size-3.5" />
              </Button>
            ) : null}
          </div>
          {trimmedValue ? (
            <p className="mt-1.5 truncate text-xs font-black text-foreground">{trimmedValue}</p>
          ) : null}
        </div>
      ) : trimmedValue ? (
        <p className="mt-1.5 truncate text-xs font-black text-foreground">{trimmedValue}</p>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="mt-1.5 h-7 px-2 text-[10px]"
        disabled={fieldDisabled || !value.trim()}
        onClick={handleSave}
      >
        <Plus className="size-3" /> 현재 이름 저장
      </Button>

      {trashedNames.length > 0 && onRestore ? (
        <div className="mt-2 rounded border border-dashed border-muted-foreground/25 bg-muted/15 px-2 py-1.5">
          <p className="mb-1 text-[9px] font-bold text-muted-foreground">삭제 목록 · 되돌리기</p>
          <div className="flex max-h-16 flex-wrap gap-1 overflow-y-auto">
            {trashedNames.map((name) => (
              <button
                key={name}
                type="button"
                disabled={fieldDisabled}
                onClick={() => handleRestore(name)}
                className="inline-flex items-center gap-0.5 rounded border bg-background px-1.5 py-0.5 text-[10px] hover:border-primary hover:text-primary disabled:opacity-40"
                title="목록에 복원"
              >
                <RotateCcw className="size-2.5 shrink-0" />
                <span className="max-w-[72px] truncate">{name}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
