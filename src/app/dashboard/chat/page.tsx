import type { Metadata } from "next";
import { Topbar } from "@/components/dashboard/topbar";
import { ChatWithHistory } from "@/components/dashboard/chat-with-history";

export const metadata: Metadata = { title: "Finovela Sohbet — Finovela" };

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  return (
    <>
      <Topbar title="Finovela Sohbet" />
      <ChatWithHistory chatId={id} />
    </>
  );
}
