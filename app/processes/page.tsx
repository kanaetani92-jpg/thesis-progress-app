import type { Metadata } from "next";

import { initialThesisProcesses } from "@/data/initial-thesis-processes";
import { TASK_STATUS_LABELS, type TaskStatus } from "@/types/thesis";

export const metadata: Metadata = {
  title: "論文工程一覧",
  description: "論文完成までの17工程と初期タスクの一覧です。",
};

function getStatusClasses(status: TaskStatus): string {
  switch (status) {
    case "in_progress":
      return "bg-blue-50 text-blue-700 ring-blue-600/20";
    case "waiting_for_review":
      return "bg-amber-50 text-amber-700 ring-amber-600/20";
    case "completed":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
    case "on_hold":
      return "bg-rose-50 text-rose-700 ring-rose-600/20";
    default:
      return "bg-slate-100 text-slate-600 ring-slate-500/20";
  }
}

export default function ProcessesPage() {
  const totalTasks = initialThesisProcesses.reduce((total, process) => total + process.tasks.length, 0);

  return (
    <div className="mx-auto max-w-6xl">
      <section>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">論文工程一覧</h1>
          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-600/20 ring-inset">固定データ</span>
        </div>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">テーマを考え始めてから論文を提出するまでの17工程です。各工程を開くと、初心者向けのタスクと説明を確認できます。</p>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-3" aria-label="工程一覧の概要">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">工程数</p><p className="mt-2 text-3xl font-bold text-slate-950">{initialThesisProcesses.length}</p></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">タスク数</p><p className="mt-2 text-3xl font-bold text-slate-950">{totalTasks}</p></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">初期状態</p><p className="mt-2 text-xl font-bold text-slate-950">すべて未着手</p></article>
      </section>

      <aside className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
        <h2 className="font-semibold text-indigo-950">すべてを一度に進める必要はありません</h2>
        <p className="mt-1 text-sm leading-6 text-indigo-700">まずは第1工程から順番に確認してください。研究分野や大学の指示によっては、複数の工程を同時に進めたり、一部のタスクを省略したりすることがあります。</p>
      </aside>

      <div className="mt-6 space-y-5">
        {initialThesisProcesses.map((process) => (
          <section key={process.id} id={process.id} className="scroll-mt-24 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <details open={process.order <= 2}>
              <summary className="cursor-pointer list-none px-5 py-5 marker:hidden sm:px-6">
                <div className="flex items-start gap-4">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-base font-bold text-indigo-700">{process.order}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div><h2 className="text-lg font-bold text-slate-900">{process.title}</h2><p className="mt-1 text-sm leading-6 text-slate-600">{process.description}</p></div>
                      <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{process.tasks.length}タスク</span>
                    </div>
                    <p className="mt-3 text-xs font-medium text-indigo-600">選択してタスクを開く</p>
                  </div>
                </div>
              </summary>

              <div className="border-t border-slate-200 bg-slate-50/60 p-4 sm:p-6">
                <ol className="space-y-3">
                  {process.tasks.map((task) => (
                    <li key={task.id} className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex min-w-0 gap-3">
                          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">{task.order}</div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold text-slate-900">{task.title}</h3>
                              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${getStatusClasses(task.status)}`}>{TASK_STATUS_LABELS[task.status]}</span>
                            </div>
                            <p className="mt-1.5 text-sm leading-6 text-slate-600">{task.description}</p>
                          </div>
                        </div>
                        <div className="shrink-0 sm:w-32">
                          <div className="flex items-center justify-between text-xs"><span className="text-slate-500">進捗</span><span className="font-semibold text-slate-700">{task.progress}%</span></div>
                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label={`${task.title}の進捗`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={task.progress}><div className="h-full rounded-full bg-indigo-500" style={{ width: `${task.progress}%` }} /></div>
                          <p className="mt-2 text-xs text-slate-500">締切：{task.deadline === null ? "未設定" : task.deadline}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </details>
          </section>
        ))}
      </div>

      <section className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
        <h2 className="font-semibold text-slate-900">現在は閲覧専用です</h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-500">タスクの状態変更、締切日の設定、進捗率の更新、メモの保存はまだ実装していません。現在表示されている内容はTypeScriptの固定データです。</p>
      </section>
    </div>
  );
}
