import Link from "next/link";

import { companionActions } from "@/data/companionActions";

const previewCards = [
  "自分ごと型",
  "社会課題型",
  "研究不足型",
] as const;

export function CompanionHome() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)] lg:items-start">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            第1段階・土台
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">
            論文伴走カード
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            論文づくりで迷ったときに、自由記述ではなくカードを選びながら次の一歩を決めるための入口です。今後、選んだカードを工程タスクやFirestore保存へつなげていきます。
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {companionActions.map((action) => (
              <Link
                key={action.id}
                href={action.href}
                aria-disabled={action.status === "placeholder"}
                className="group rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-indigo-200 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="text-sm font-bold text-slate-950">{action.label}</span>
                  <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500 ring-1 ring-slate-200">
                    準備中
                  </span>
                </span>
                <span className="mt-2 block text-xs leading-5 text-slate-600">
                  {action.description}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-sm font-bold text-slate-950">カード選択UIの予定</p>
          <p className="mt-2 text-xs leading-6 text-slate-600">
            1つの質問に対して3つのカードを表示し、選んだ内容をチャット履歴と論文工程タスクへ反映する想定です。
          </p>
          <div className="mt-4 grid gap-3">
            {previewCards.map((card) => (
              <div key={card} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">{card}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  利用者が選びやすい短い説明を置く予定です。
                </p>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-slate-950">工程と連動</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            選んだカードを既存の17工程タスクへ反映する土台にします。
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-slate-950">会話履歴を保存</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            次段階で、選択内容を履歴として残す設計を追加します。
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-slate-950">スマホ対応</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            小さな画面でもカードを縦に並べて選びやすくします。
          </p>
        </div>
      </section>
    </div>
  );
}
