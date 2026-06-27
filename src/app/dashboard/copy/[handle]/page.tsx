import type { Metadata } from "next";
import { Topbar } from "@/components/dashboard/topbar";
import { CopyTraderProfile } from "@/components/dashboard/copy-trader-profile";
import { CopyTrackRecord } from "@/components/dashboard/copy-track-record";
import { LEADERBOARD, type Trader } from "@/lib/dashboard/data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const trader = LEADERBOARD.find((t) => t.handle.replace("@", "") === handle);
  return { title: trader ? `${trader.name} — Finovela` : "Yatırımcı — Finovela" };
}

export default async function CopyTraderPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const trader: Trader | undefined = LEADERBOARD.find(
    (t) => t.handle.replace("@", "") === handle,
  );
  return (
    <>
      <Topbar title={trader?.name ?? "Yatırımcı"} />
      <div className="ais min-h-[calc(100vh-64px)]">
        <div className="max-w-7xl px-8 py-10">
          {trader && <CopyTrackRecord trader={trader} />}
        </div>
        <CopyTraderProfile handle={handle} />
      </div>
    </>
  );
}
