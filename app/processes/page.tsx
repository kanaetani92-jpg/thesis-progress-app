import type { Metadata } from "next";

import { ThesisManager } from "@/components/ThesisManager";

export const metadata: Metadata = {
  title: "論文工程一覧",
  description: "論文工程ごとのタスク、進捗、締切、優先度、メモを管理します。",
};

export default function ProcessesPage() {
  return <ThesisManager view="processes" />;
}
