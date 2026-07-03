"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { mockSearch, SearchCandidate } from "@/lib/sample-data";
import { krw } from "@/lib/utils";

/**
 * 사양서 11번: 자동 검색 자리.
 * 지금은 mock 데이터. 추후 onPick으로 받은 후보를 폼에 채운다.
 * 실제 연결 시 mockSearch 대신 fetch('/api/search?q=') 로 교체.
 */
export function ProductSearch({ onPick }: { onPick: (c: SearchCandidate) => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchCandidate[] | null>(null);

  const run = () => setResults(mockSearch(q));

  return (
    <div className="rounded-md border bg-muted/40 p-3">
      <div className="mb-1 text-xs font-bold text-muted-foreground">
        상품 자동 검색 <span className="font-normal">(준비 중 · 현재는 예시 데이터)</span>
      </div>
      <div className="flex gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
          placeholder="상품명으로 검색 (예: 크림)"
        />
        <Button variant="outline" onClick={run}>
          <Search /> 검색
        </Button>
      </div>
      {results && (
        <div className="mt-2 space-y-1">
          {results.length === 0 && <div className="px-1 py-2 text-sm text-muted-foreground">검색 결과가 없어요.</div>}
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => onPick(r)}
              className="flex w-full items-center justify-between rounded-md border bg-white px-3 py-2 text-left text-sm hover:border-primary"
            >
              <span>
                <b>{r.name}</b>
                {r.volume && <span className="ml-1 text-muted-foreground">· {r.volume}</span>}
                <span className="ml-2 text-[11px] text-muted-foreground">{r.source}</span>
              </span>
              <span className="font-bold text-brand-red">{krw(r.price)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
