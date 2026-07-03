"use client";
import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      toastOptions={{
        style: { fontFamily: "var(--font-sans)", fontWeight: 500 },
      }}
    />
  );
}
