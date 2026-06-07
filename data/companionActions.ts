import { companionActionHref } from "@/lib/companionRoutes";
import type { CompanionAction } from "@/types/companion";

export const companionActions: readonly CompanionAction[] = [
  {
    id: "start-thesis",
    label: "論文作成を始める",
    description: "最初の質問カードから、今やることを一緒に選びます。",
    href: companionActionHref("start-thesis"),
    status: "placeholder",
  },
  {
    id: "resume-session",
    label: "前回の続きから始める",
    description: "前回選んだカードや進捗をもとに再開する予定です。",
    href: companionActionHref("resume-session"),
    status: "placeholder",
  },
  {
    id: "diagnose-blocker",
    label: "今の詰まりを診断する",
    description: "手が止まっている理由を3択カードで整理する予定です。",
    href: companionActionHref("diagnose-blocker"),
    status: "placeholder",
  },
  {
    id: "plan-from-deadline",
    label: "締切から計画を立てる",
    description: "提出日から逆算して、次の作業を提案する予定です。",
    href: companionActionHref("plan-from-deadline"),
    status: "placeholder",
  },
];
