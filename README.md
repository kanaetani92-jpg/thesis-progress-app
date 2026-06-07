# 論文工程管理アプリ

論文を書き慣れていない大学生・大学院生向けに、論文完成までの工程とタスクを確認するためのNext.jsアプリです。

## 現在の実装範囲

- Next.js / TypeScript / Tailwind CSS
- 共通レイアウト
- ヘッダー
- サイドメニュー
- ダッシュボード
- 論文工程一覧
- 17工程・92件の初心者向け初期タスク
- TypeScriptによる型定義
- 固定データによる表示

Firebase、Firestore、認証、データ編集・保存はまだ実装していません。

## 起動方法

```bash
npm install
npm run dev
```

ブラウザで `http://localhost:3000` を開いてください。

## 確認コマンド

```bash
npm run lint
npm run build
```
