"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type MenuIconName = "dashboard" | "process" | "companion" | "task" | "settings";

type NavigationItem = {
  label: string;
  description: string;
  icon: MenuIconName;
  href?: string;
  disabled?: boolean;
};

const navigationItems: NavigationItem[] = [
  {
    label: "ダッシュボード",
    description: "現在の進捗を確認",
    icon: "dashboard",
    href: "/dashboard",
  },
  {
    label: "論文工程",
    description: "17工程とタスクの一覧",
    icon: "process",
    href: "/processes",
  },
  {
    label: "論文伴走カード",
    description: "カードを選んで次の一歩へ",
    icon: "companion",
    href: "/",
  },
  {
    label: "タスク",
    description: "締切と状態を管理",
    icon: "task",
    disabled: true,
  },
  {
    label: "利用者設定",
    description: "基本情報を変更",
    icon: "settings",
    disabled: true,
  },
];

function MenuIcon({ name }: { name: MenuIconName }) {
  if (name === "dashboard") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    );
  }

  if (name === "process") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5" aria-hidden="true">
        <path d="M8 5h11" />
        <path d="M8 12h11" />
        <path d="M8 19h11" />
        <circle cx="4" cy="5" r="1.5" />
        <circle cx="4" cy="12" r="1.5" />
        <circle cx="4" cy="19" r="1.5" />
      </svg>
    );
  }

  if (name === "companion") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5" aria-hidden="true">
        <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3h9A2.5 2.5 0 0 1 19 5.5v8A2.5 2.5 0 0 1 16.5 16H10l-4 4v-4.5A2.5 2.5 0 0 1 5 13.5v-8Z" />
        <path d="M8.5 8h7" />
        <path d="M8.5 11.5h4.5" />
      </svg>
    );
  }

  if (name === "task") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5" aria-hidden="true">
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 8h8" />
        <path d="M8 12h8" />
        <path d="M8 16h5" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
    </svg>
  );
}

function isCurrentPath(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="border-b border-slate-200 bg-white md:sticky md:top-16 md:h-[calc(100vh-4rem)] md:w-64 md:shrink-0 md:border-r md:border-b-0">
      <nav className="overflow-x-auto p-3 md:h-full md:overflow-y-auto md:p-4" aria-label="メインメニュー">
        <ul className="flex min-w-max gap-2 md:min-w-0 md:flex-col">
          {navigationItems.map((item) => {
            const current = item.href !== undefined && isCurrentPath(pathname, item.href);

            return (
              <li key={item.label} className="md:w-full">
                {item.disabled || item.href === undefined ? (
                  <div className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-slate-400 md:w-full" aria-disabled="true" title="今後の工程で実装します">
                    <MenuIcon name={item.icon} />
                    <div className="hidden min-w-0 flex-1 md:block">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">{item.label}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">準備中</span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-slate-400">{item.description}</p>
                    </div>
                    <span className="text-sm font-medium md:hidden">{item.label}</span>
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    aria-current={current ? "page" : undefined}
                    className={[
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors md:w-full",
                      current
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                    ].join(" ")}
                  >
                    <MenuIcon name={item.icon} />
                    <div className="hidden min-w-0 md:block">
                      <p className="text-sm font-semibold">{item.label}</p>
                      <p className={["mt-0.5 truncate text-xs", current ? "text-indigo-600" : "text-slate-500"].join(" ")}>{item.description}</p>
                    </div>
                    <span className="text-sm font-semibold md:hidden">{item.label}</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>

        <div className="mt-6 hidden rounded-xl border border-indigo-100 bg-indigo-50 p-4 md:block">
          <p className="text-sm font-semibold text-indigo-900">初期工程データを表示中</p>
          <p className="mt-1.5 text-xs leading-5 text-indigo-700">17工程と初心者向けタスクを固定データから読み込んでいます。</p>
        </div>
      </nav>
    </aside>
  );
}
