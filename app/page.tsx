import Link from "next/link";

import {
  initialThesisProcesses,
  initialThesisTasks,
} from "@/data/initial-thesis-processes";
import { TASK_STATUS_LABELS } from "@/types/thesis";

const totalProcesses = initialThesisProcesses.length;
const totalTasks = initialThesisTasks.length;
const completedTasks = initialThesisTasks.filter((task) => task.status === "completed").length;
const overallProgress =
  totalTasks === 0
    ? 0
    : Math.round(initialThesisTasks.reduce((total, task) => total + task.progress, 0) / totalTasks);
const recommendedTasks = initialThesisProcesses
  .flatMap((process) => process.tasks.map((task) => ({ process, task })))
  .slice(0, 3);

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">ダッシュボード</h1>
            <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-600/20 ring-inset">固定データ</span>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">論文完成までの17工程と、最初に取り組むタスクを確認できます。</p>
        </div>
        <Link href="/processes" className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700">工程一覧を見る</Link>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="論文工程の概要">
        {[
          ["工程数", String(totalProcesses), "テーマ検討から提出まで"],
          ["初期タスク数", String(totalTasks), "初心者向けの作業項目"],
          ["完了タスク", `${completedTasks} / ${totalTasks}`, "初期状態ではすべて未着手"],
          ["全体進捗", `${overallProgress}%`, "全タスクの進捗率の平均"],
        ].map(([label, value, detail]) => (
          <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
            <p className="mt-2 text-sm text-slate-500">{detail}</p>
          </article>
        ))}
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl bg-indigo-700 text-white shadow-sm">
        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-center lg:p-8">
          <div>
            <p className="text-sm font-medium text-indigo-100">論文全体の進捗</p>
            <div className="mt-2 flex items-end gap-3">
              <p className="text-4xl font-bold tracking-tight">{overallProgress}%</p>
              <p className="pb-1 text-sm text-indigo-100">{completedTasks}件完了／全{totalTasks}件</p>
            </div>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-indigo-950/40" role="progressbar" aria-label="論文全体の進捗" aria-valuemin={0} aria-valuemax={100} aria-valuenow={overallProgress}>
              <div className="h-full rounded-full bg-white" style={{ width: `${overallProgress}%` }} />
            </div>
            <p className="mt-4 text-sm leading-6 text-indigo-100">まずは第1工程「研究テーマの方向づけ」から始めましょう。</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4 text-center ring-1 ring-white/20">
            <p className="text-xs font-medium text-indigo-100">現在の工程</p>
            <p className="mt-1 text-3xl font-bold">1</p>
            <p className="mt-1 text-xs text-indigo-100">研究テーマの方向づけ</p>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.65fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
            <p className="text-sm font-medium text-indigo-600">最初のステップ</p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">まず取り組むタスク</h2>
            <p className="mt-1 text-sm text-slate-500">テーマを決めるための基本的なタスクです。</p>
          </div>
          <ol className="divide-y divide-slate-100">
            {recommendedTasks.map(({ process, task }, index) => (
              <li key={task.id} className="p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-700">{index + 1}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{TASK_STATUS_LABELS[task.status]}</span>
                      <span className="text-xs text-slate-500">第{process.order}工程</span>
                    </div>
                    <h3 className="mt-2 font-semibold text-slate-900">{task.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{task.description}</p>
                    <Link href={`/processes#${process.id}`} className="mt-3 inline-flex text-sm font-semibold text-indigo-600 hover:text-indigo-700">この工程を確認する<span aria-hidden="true"> →</span></Link>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4 sm:px-6"><h2 className="text-lg font-bold text-slate-900">データの実装状態</h2></div>
          <div className="space-y-4 p-5 sm:p-6">
            <div className="rounded-xl bg-emerald-50 p-4"><p className="font-semibold text-emerald-900">固定データを読み込み済み</p><p className="mt-1 text-sm leading-6 text-emerald-700">17工程と{totalTasks}件のタスクをTypeScriptファイルから読み込んでいます。</p></div>
            <div className="rounded-xl bg-amber-50 p-4"><p className="font-semibold text-amber-900">データ保存は未実装</p><p className="mt-1 text-sm leading-6 text-amber-700">画面を操作しても、Firestoreやブラウザには保存されません。</p></div>
            <Link href="/processes" className="inline-flex w-full items-center justify-center rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-50">全17工程を確認する</Link>
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div><h2 className="text-lg font-bold text-slate-900">17工程の全体像</h2><p className="mt-1 text-sm text-slate-500">各工程を選ぶと、工程一覧の該当位置へ移動します。</p></div>
          <Link href="/processes" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">詳細な工程一覧を見る</Link>
        </div>
        <ol className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
          {initialThesisProcesses.map((process) => (
            <li key={process.id}>
              <Link href={`/processes#${process.id}`} className="flex h-full items-start gap-3 rounded-xl border border-slate-200 p-4 transition-colors hover:border-indigo-300 hover:bg-indigo-50">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">{process.order}</div>
                <div className="min-w-0"><h3 className="font-semibold text-slate-900">{process.title}</h3><p className="mt-1 text-xs text-slate-500">{process.tasks.length}タスク</p></div>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
