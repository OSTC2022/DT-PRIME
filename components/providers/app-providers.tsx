"use client";

import { ProductExcelExportProvider } from "@/components/products/product-excel-export-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <ProductExcelExportProvider>{children}</ProductExcelExportProvider>;
}
