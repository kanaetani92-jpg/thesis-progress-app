import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "論文工程管理",
    template: "%s | 論文工程管理",
  },
  description:
    "大学生・大学院生の論文作成工程と進捗を管理するWebアプリです。",
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ja">
      <body>
        <a
          href="#main-content"
          className="fixed left-4 top-2 z-50 -translate-y-20 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-transform focus:translate-y-0"
        >
          メインコンテンツへ移動
        </a>

        <div className="min-h-screen bg-slate-50">
          <Header />

          <div className="mx-auto max-w-[1600px] md:flex">
            <Sidebar />

            <main
              id="main-content"
              className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8"
            >
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
