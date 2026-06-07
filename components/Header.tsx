export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white shadow-sm"
            aria-hidden="true"
          >
            論
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900 sm:text-base">
              論文工程管理
            </p>
            <p className="hidden text-xs text-slate-500 sm:block">
              論文完成までの作業を整理する
            </p>
          </div>

          <span className="hidden rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 lg:inline-flex">
            基盤版
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-slate-700">ゲスト利用者</p>
            <p className="text-xs text-slate-500">認証機能は未実装です</p>
          </div>

          <div
            className="flex size-9 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600"
            aria-label="ゲスト利用者"
          >
            G
          </div>
        </div>
      </div>
    </header>
  );
}
