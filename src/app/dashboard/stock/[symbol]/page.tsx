import type { Metadata } from "next";
import { Topbar } from "@/components/dashboard/topbar";
import { StockDetail } from "@/components/dashboard/stock-detail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ symbol: string }>;
}): Promise<Metadata> {
  const { symbol } = await params;
  return { title: `${symbol.toUpperCase()} — Finovela` };
}

export default async function StockPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;
  return (
    <>
      <Topbar title={symbol.toUpperCase()} />
      <div className="ais ais-light min-h-[calc(100vh-64px)]">
        <StockDetail symbol={symbol.toUpperCase()} />
      </div>
    </>
  );
}
