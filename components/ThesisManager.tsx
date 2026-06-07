"use client";

import Link from "next/link";
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  linkWithCredential,
  linkWithPopup,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { initialThesisProcesses } from "@/data/initial-thesis-processes";
import { auth, db, googleProvider, hasFirebaseConfig } from "@/lib/firebase";
import {
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  type ISODateString,
  type TaskPriority,
  type TaskStatus,
  type ThesisProcess,
  type ThesisTask,
} from "@/types/thesis";

type Task = Omit<ThesisTask, "priority"> & { priority: TaskPriority };
type Process = Omit<ThesisProcess, "tasks"> & { tasks: Task[] };
type Entry = { process: Process; task: Task };
type Props = { view: "dashboard" | "processes" };
type AuthMode = "login" | "signup";

const PROJECT_ID = "default-thesis-project";
const STATUSES: TaskStatus[] = ["not_started", "in_progress", "waiting_for_review", "completed", "on_hold"];
const PRIORITIES: TaskPriority[] = ["high", "medium", "low"];
const PORDER: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };

const initial = (): Process[] =>
  initialThesisProcesses.map((p) => ({
    ...p,
    tasks: p.tasks.map((t) => ({ ...t, priority: t.priority ?? "medium" })),
  }));

function mergeSaved(value: unknown): Process[] {
  const base = initial();
  if (!Array.isArray(value)) return base;

  const map = new Map<string, Partial<Task>>();
  value.forEach((process) => {
    const tasks = (process as { tasks?: unknown }).tasks;
    if (!Array.isArray(tasks)) return;
    tasks.forEach((task) => {
      const saved = task as Partial<Task> & { id?: unknown };
      if (typeof saved.id === "string") map.set(saved.id, saved);
    });
  });

  return base.map((p) => ({
    ...p,
    tasks: p.tasks.map((t) => {
      const s = map.get(t.id);
      if (!s) return t;
      return {
        ...t,
        status: s.status && STATUSES.includes(s.status) ? s.status : t.status,
        priority: s.priority && PRIORITIES.includes(s.priority) ? s.priority : t.priority,
        progress: typeof s.progress === "number" ? Math.min(100, Math.max(0, Math.round(s.progress))) : t.progress,
        deadline: s.deadline === null || (typeof s.deadline === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s.deadline)) ? s.deadline : t.deadline,
        memo: typeof s.memo === "string" ? s.memo : t.memo,
      };
    }),
  }));
}

const date = (value: ISODateString) => new Date(`${value}T00:00:00`);
const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const weekStart = (d: Date) => { const x = today(); x.setTime(d.getTime()); x.setHours(0,0,0,0); x.setDate(x.getDate() - (x.getDay() === 0 ? 6 : x.getDay() - 1)); return x; };
const weekEnd = (d: Date) => { const x = weekStart(d); x.setDate(x.getDate() + 6); x.setHours(23,59,59,999); return x; };
const isOverdue = (t: Task, now: Date | null) => Boolean(now && t.deadline && t.status !== "completed" && date(t.deadline) < now);
const isThisWeek = (t: Task, now: Date | null) => Boolean(now && t.deadline && t.status !== "completed" && date(t.deadline) >= weekStart(now) && date(t.deadline) <= weekEnd(now));
const avg = (tasks: readonly Task[]) => tasks.length ? Math.round(tasks.reduce((n, t) => n + t.progress, 0) / tasks.length) : 0;
const sortEntries = (a: Entry, b: Entry) => PORDER[a.task.priority] - PORDER[b.task.priority] || (a.task.deadline ?? "9999").localeCompare(b.task.deadline ?? "9999") || a.process.order - b.process.order;
const statusClass = (s: TaskStatus) => ({ not_started:"bg-slate-100 text-slate-600", in_progress:"bg-blue-50 text-blue-700", waiting_for_review:"bg-amber-50 text-amber-700", completed:"bg-emerald-50 text-emerald-700", on_hold:"bg-rose-50 text-rose-700" })[s];
const priorityClass = (p: TaskPriority) => p === "high" ? "bg-rose-50 text-rose-700" : p === "low" ? "bg-slate-100 text-slate-600" : "bg-amber-50 text-amber-700";

function authErrorMessage(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String((error as { code?: unknown }).code) : "";
  const messages: Record<string, string> = {
    "auth/email-already-in-use": "このメールアドレスはすでに登録されています。ログインをお試しください。",
    "auth/invalid-email": "メールアドレスの形式を確認してください。",
    "auth/invalid-credential": "メールアドレスまたはパスワードが正しくありません。",
    "auth/popup-closed-by-user": "ログイン画面が閉じられました。もう一度お試しください。",
    "auth/provider-already-linked": "このログイン方法はすでに連携されています。",
    "auth/requires-recent-login": "安全のため、ログインし直してからもう一度お試しください。",
    "auth/too-many-requests": "試行回数が多すぎます。時間をおいて再度お試しください。",
    "auth/user-not-found": "このメールアドレスの登録が見つかりません。",
    "auth/weak-password": "パスワードは6文字以上で入力してください。",
    "auth/wrong-password": "パスワードが正しくありません。",
  };
  return messages[code] ?? "認証処理に失敗しました。入力内容や通信状態を確認してください。";
}

function projectRef(userId: string) {
  if (!db) throw new Error("Firebaseの環境変数が未設定です。.env.localを確認してください。");
  return doc(db, "users", userId, "projects", PROJECT_ID);
}

async function loadProject(userId: string): Promise<Process[]> {
  const ref = projectRef(userId);
  const snapshot = await getDoc(ref);
  if (snapshot.exists()) return mergeSaved(snapshot.data().processes);

  const fresh = initial();
  await setDoc(ref, {
    title: "論文工程管理",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    processes: fresh,
  });
  return fresh;
}

async function saveProject(userId: string, processes: Process[]) {
  await setDoc(projectRef(userId), {
    title: "論文工程管理",
    updatedAt: serverTimestamp(),
    processes,
  }, { merge: true });
}

export function ThesisManager({ view }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [processes, setProcesses] = useState<Process[]>(initial);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    if (!hasFirebaseConfig || !auth) {
      setError("Firebaseの環境変数が未設定です。.env.localを確認してください。");
      setAuthLoading(false);
      return;
    }

    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthLoading(false);
      setError(null);
    }, () => {
      setError("認証状態を確認できませんでした。時間をおいて再度お試しください。");
      setAuthLoading(false);
    });
  }, []);

  useEffect(() => {
    setNow(today());
    if (!user) {
      setProcesses(initial());
      setDataLoading(false);
      return;
    }

    let active = true;
    setDataLoading(true);
    loadProject(user.uid)
      .then((loaded) => { if (active) setProcesses(loaded); })
      .catch(() => { if (active) setError("Firestoreからデータを読み込めませんでした。"); })
      .finally(() => { if (active) setDataLoading(false); });

    return () => { active = false; };
  }, [user]);

  const loginWithEmail = async (email: string, password: string, mode: AuthMode) => {
    if (!auth) return setError("Firebase Authenticationを初期化できませんでした。");
    setError(null);
    setNotice(null);
    try {
      if (mode === "signup") await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(authErrorMessage(err));
    }
  };

  const loginWithGoogle = async () => {
    if (!auth) return setError("Firebase Authenticationを初期化できませんでした。");
    setError(null);
    setNotice(null);
    try {
      if (auth.currentUser?.isAnonymous) {
        await linkWithPopup(auth.currentUser, googleProvider);
        setNotice("ゲストデータをGoogleアカウントへ移行しました。");
        return;
      }
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(authErrorMessage(err));
    }
  };

  const loginAsGuest = async () => {
    if (!auth) return setError("Firebase Authenticationを初期化できませんでした。");
    setError(null);
    setNotice(null);
    try {
      await signInAnonymously(auth);
    } catch (err) {
      setError(authErrorMessage(err));
    }
  };

  const resetPassword = async (email: string) => {
    if (!auth) return setError("Firebase Authenticationを初期化できませんでした。");
    setError(null);
    setNotice(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setNotice("パスワード再設定メールを送信しました。");
    } catch (err) {
      setError(authErrorMessage(err));
    }
  };

  const upgradeGuestWithEmail = async (email: string, password: string) => {
    if (!auth?.currentUser?.isAnonymous) return setError("ゲスト利用中のみ正式登録できます。");
    setError(null);
    setNotice(null);
    try {
      const credential = EmailAuthProvider.credential(email, password);
      await linkWithCredential(auth.currentUser, credential);
      setNotice("ゲストデータを正式アカウントへ移行しました。");
    } catch (err) {
      setError(authErrorMessage(err));
    }
  };

  const logout = async () => {
    if (!auth) return;
    setError(null);
    setNotice(null);
    try {
      await signOut(auth);
    } catch (err) {
      setError(authErrorMessage(err));
    }
  };

  const persist = async (next: Process[]) => {
    if (!user) return setError("保存するにはログインが必要です。");
    setSaving(true);
    setError(null);
    try {
      await saveProject(user.uid, next);
    } catch {
      setError("Firestoreへの保存に失敗しました。通信状態や権限を確認してください。");
    } finally {
      setSaving(false);
    }
  };

  const save = (fn: (current: Process[]) => Process[]) => setProcesses((current) => {
    const next = fn(current);
    void persist(next);
    return next;
  });
  const patch = (pid: string, tid: string, changes: Partial<Task>) => save((all) => all.map((p) => p.id === pid ? { ...p, tasks: p.tasks.map((t) => t.id === tid ? { ...t, ...changes } : t) } : p));
  const changeStatus = (pid: string, task: Task, status: TaskStatus) => {
    const progress = status === "completed" ? 100 : status === "not_started" ? 0 : task.progress === 0 ? 25 : task.progress === 100 ? 90 : task.progress;
    patch(pid, task.id, { status, progress });
  };
  const changeProgress = (pid: string, task: Task, value: number) => {
    const progress = Math.min(100, Math.max(0, Math.round(value || 0)));
    const status = progress === 100 ? "completed" : progress > 0 && ["not_started", "completed"].includes(task.status) ? "in_progress" : progress === 0 && task.status === "completed" ? "not_started" : task.status;
    patch(pid, task.id, { progress, status });
  };
  const reset = () => {
    if (!confirm("Firestoreに保存した変更を初期状態に戻しますか？")) return;
    save(() => initial());
  };

  const entries = useMemo(() => processes.flatMap((process) => process.tasks.map((task) => ({ process, task }))), [processes]);
  const completed = entries.filter(({ task }) => task.status === "completed").length;
  const overall = avg(entries.map(({ task }) => task));
  const overdue = entries.filter(({ task }) => isOverdue(task, now)).sort(sortEntries);
  const week = entries.filter(({ task }) => isThisWeek(task, now)).sort(sortEntries);
  const priority = entries.filter(({ task }) => task.status !== "completed").sort(sortEntries).slice(0, 5);

  if (authLoading) return <Loading message="認証状態を確認しています。" />;
  if (!user) return <LoginScreen error={error} notice={notice} onEmailAuth={loginWithEmail} onGoogleLogin={loginWithGoogle} onGuestLogin={loginAsGuest} onResetPassword={resetPassword} />;
  if (dataLoading) return <Loading message="Firestoreから工程データを読み込んでいます。" />;

  const notices = <StatusNotices error={error} notice={notice} saving={saving} />;
  const account = <Account user={user} onLogout={logout} onGoogleUpgrade={loginWithGoogle} onEmailUpgrade={upgradeGuestWithEmail} />;

  return view === "dashboard" ? (
    <>{notices}<Dashboard processes={processes} total={entries.length} completed={completed} overall={overall} overdue={overdue} week={week} priority={priority} account={account} /></>
  ) : (
    <>{notices}<ProcessList processes={processes} total={entries.length} completed={completed} overall={overall} overdueCount={overdue.length} now={now} patch={patch} changeStatus={changeStatus} changeProgress={changeProgress} reset={reset} account={account} /></>
  );
}

function Loading({ message }: { message: string }) { return <div className="mx-auto max-w-7xl"><section className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">{message}</section></div>; }
function LoginScreen({ error, notice, onEmailAuth, onGoogleLogin, onGuestLogin, onResetPassword }: { error: string | null; notice: string | null; onEmailAuth: (email: string, password: string, mode: AuthMode) => void; onGoogleLogin: () => void; onGuestLogin: () => void; onResetPassword: (email: string) => void }) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onEmailAuth(email, password, mode); };
  return <main className="mx-auto flex min-h-[60vh] max-w-xl items-center"><section className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h1 className="text-2xl font-bold">論文工程管理</h1><p className="mt-2 text-sm leading-6 text-slate-600">メールアドレス、Googleアカウント、またはゲストとして利用できます。</p>{notice && <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</p>}{error && <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}<div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1"><button type="button" onClick={() => setMode("login")} className={`rounded-lg px-3 py-2 text-sm font-semibold ${mode === "login" ? "bg-white text-slate-950 shadow-sm" : "text-slate-600"}`}>ログイン</button><button type="button" onClick={() => setMode("signup")} className={`rounded-lg px-3 py-2 text-sm font-semibold ${mode === "signup" ? "bg-white text-slate-950 shadow-sm" : "text-slate-600"}`}>新規登録</button></div><form onSubmit={submit} className="mt-5 space-y-4"><Label text="メールアドレス"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900" /></Label><Label text="パスワード"><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900" /></Label><button type="submit" className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white">{mode === "login" ? "メールでログイン" : "メールで新規登録"}</button></form><button type="button" onClick={() => onResetPassword(email)} className="mt-3 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700">パスワード再設定メールを送る</button><div className="my-5 h-px bg-slate-200" /><div className="space-y-3"><button onClick={onGoogleLogin} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700">Googleでログイン</button><button onClick={onGuestLogin} className="w-full rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">ゲストとして始める</button></div></section></main>;
}
function StatusNotices({ error, notice, saving }: { error: string | null; notice: string | null; saving: boolean }) { if (!error && !notice && !saving) return null; return <div className="mx-auto mb-4 max-w-7xl space-y-2">{saving && <p className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">Firestoreへ保存しています。</p>}{notice && <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</p>}{error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}</div>; }
function Account({ user, onLogout, onGoogleUpgrade, onEmailUpgrade }: { user: User; onLogout: () => void; onGoogleUpgrade: () => void; onEmailUpgrade: (email: string, password: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onEmailUpgrade(email, password); };
  return <div className="flex max-w-xl flex-wrap items-center justify-end gap-3">{user.isAnonymous ? <div className="w-full rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><b>ゲスト利用中</b><p className="mt-1">正式登録すると、現在のデータを同じアカウントで引き続き使えます。</p><form onSubmit={submit} className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="メールアドレス" className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm" /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="パスワード" className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm" /><button className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white">正式登録</button></form><button onClick={onGoogleUpgrade} className="mt-2 rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-semibold text-amber-800">Googleへ移行</button></div> : <span className="text-xs text-slate-500">{user.email ?? "ログイン中"}</span>}<button onClick={onLogout} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700">ログアウト</button></div>;
}

function Dashboard({ processes, total, completed, overall, overdue, week, priority, account }: { processes: Process[]; total: number; completed: number; overall: number; overdue: Entry[]; week: Entry[]; priority: Entry[]; account: ReactNode }) {
  return <div className="mx-auto max-w-7xl">
    <Header title="ダッシュボード" text="工程別進捗、締切超過、今週のタスクを確認できます。" action={<div className="flex flex-wrap items-center justify-end gap-3"><Link href="/processes" className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white">工程を編集する</Link>{account}</div>} />
    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Stat label="全体進捗" value={`${overall}%`} detail={`${completed}件完了／全${total}件`} /><Stat label="締切超過" value={`${overdue.length}件`} detail="未完了で期限超過" alert={overdue.length > 0} /><Stat label="今週のタスク" value={`${week.length}件`} detail="月曜日から日曜日" /><Stat label="保存先" value="Firestore" detail="ログイン利用者ごとに保存" /></div>
    <section className="mt-6 rounded-2xl bg-indigo-700 p-6 text-white shadow-sm lg:p-8"><div className="flex items-end justify-between"><div><p className="text-sm text-indigo-100">論文全体の進捗</p><p className="mt-2 text-4xl font-bold">{overall}%</p></div><p className="text-sm text-indigo-100">{completed} / {total} 完了</p></div><Bar value={overall} light /></section>
    <div className="mt-6 grid gap-6 xl:grid-cols-2"><Tasks title="今週のタスク" entries={week} empty="今週が締切のタスクはありません。" /><Tasks title="締切を過ぎたタスク" entries={overdue} empty="締切を過ぎたタスクはありません。" alert /></div>
    <Tasks title="優先して進めるタスク" entries={priority} empty="未完了のタスクはありません。" />
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm"><h2 className="border-b border-slate-200 px-5 py-4 text-lg font-bold sm:px-6">工程別進捗率</h2><ol className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">{processes.map((p) => { const value = avg(p.tasks); const done = p.tasks.filter((t) => t.status === "completed").length; return <li key={p.id} className="rounded-xl border border-slate-200 p-4"><div className="flex gap-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">{p.order}</span><div className="min-w-0 flex-1"><div className="flex justify-between gap-3"><b>{p.title}</b><b>{value}%</b></div><p className="mt-1 text-xs text-slate-500">{done}/{p.tasks.length}件完了</p><Bar value={value} /></div></div></li>; })}</ol></section>
  </div>;
}

function ProcessList({ processes, total, completed, overall, overdueCount, now, patch, changeStatus, changeProgress, reset, account }: { processes: Process[]; total: number; completed: number; overall: number; overdueCount: number; now: Date | null; patch: (pid: string, tid: string, changes: Partial<Task>) => void; changeStatus: (pid: string, task: Task, status: TaskStatus) => void; changeProgress: (pid: string, task: Task, value: number) => void; reset: () => void; account: ReactNode }) {
  return <div className="mx-auto max-w-7xl">
    <Header title="論文工程管理" text="状態、締切日、進捗率、優先度、メモはFirestoreに自動保存されます。" action={<div className="flex flex-wrap items-center justify-end gap-3"><button onClick={reset} className="rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-700">初期状態に戻す</button>{account}</div>} />
    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Stat label="全体進捗" value={`${overall}%`} detail={`${completed}件完了／全${total}件`} /><Stat label="工程数" value={`${processes.length}`} detail="テーマ検討から提出まで" /><Stat label="締切超過" value={`${overdueCount}件`} detail="未完了で期限超過" alert={overdueCount > 0} /><Stat label="保存先" value="Firestore" detail="ログイン利用者ごとに保存" /></div>
    <section className="mt-6 rounded-2xl bg-indigo-700 p-6 text-white shadow-sm lg:p-8"><div className="flex items-end justify-between"><div><p className="text-sm text-indigo-100">論文全体の進捗</p><p className="mt-2 text-4xl font-bold">{overall}%</p></div><p className="text-sm text-indigo-100">{completed} / {total} 完了</p></div><Bar value={overall} light /></section>
    <div className="mt-6 space-y-5">{processes.map((p) => { const value = avg(p.tasks); const done = p.tasks.filter((t) => t.status === "completed").length; const late = p.tasks.filter((t) => isOverdue(t, now)).length; return <section key={p.id} id={p.id} className="scroll-mt-24 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><details open={p.order <= 2}><summary className="cursor-pointer list-none px-5 py-5 sm:px-6"><div className="flex gap-4"><span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">{p.order}</span><div className="min-w-0 flex-1"><div className="flex flex-col gap-2 lg:flex-row lg:justify-between"><div><h2 className="text-lg font-bold">{p.title}</h2><p className="mt-1 text-sm text-slate-600">{p.description}</p></div><div className="flex flex-wrap gap-2 text-xs"><Badge text={`進捗 ${value}%`} cls="bg-indigo-50 text-indigo-700" /><Badge text={`${done}/${p.tasks.length}件完了`} cls="bg-slate-100 text-slate-600" />{late > 0 && <Badge text={`超過 ${late}件`} cls="bg-rose-50 text-rose-700" />}</div></div><Bar value={value} /></div></div></summary><ol className="space-y-4 border-t border-slate-200 bg-slate-50/60 p-4 sm:p-6">{p.tasks.map((t) => <Editor key={t.id} pid={p.id} task={t} late={isOverdue(t, now)} patch={patch} changeStatus={changeStatus} changeProgress={changeProgress} />)}</ol></details></section>; })}</div>
  </div>;
}

function Editor({ pid, task, late, patch, changeStatus, changeProgress }: { pid: string; task: Task; late: boolean; patch: (pid: string, tid: string, changes: Partial<Task>) => void; changeStatus: (pid: string, task: Task, status: TaskStatus) => void; changeProgress: (pid: string, task: Task, value: number) => void }) {
  const input = "mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900";
  return <li className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5"><div className="flex gap-3"><span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold">{task.order}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{task.title}</h3><Badge text={TASK_STATUS_LABELS[task.status]} cls={statusClass(task.status)} /><Badge text={`優先度 ${TASK_PRIORITY_LABELS[task.priority]}`} cls={priorityClass(task.priority)} />{late && <Badge text="締切超過" cls="bg-rose-600 text-white" />}</div><p className="mt-1.5 text-sm leading-6 text-slate-600">{task.description}</p><div className="mt-4 grid gap-4 md:grid-cols-3"><Label text="状態"><select value={task.status} onChange={(e: ChangeEvent<HTMLSelectElement>) => changeStatus(pid, task, e.target.value as TaskStatus)} className={input}>{STATUSES.map((s) => <option key={s} value={s}>{TASK_STATUS_LABELS[s]}</option>)}</select></Label><Label text="優先度"><select value={task.priority} onChange={(e: ChangeEvent<HTMLSelectElement>) => patch(pid, task.id, { priority: e.target.value as TaskPriority })} className={input}>{PRIORITIES.map((p) => <option key={p} value={p}>{TASK_PRIORITY_LABELS[p]}</option>)}</select></Label><Label text="締切日"><input type="date" value={task.deadline ?? ""} onChange={(e: ChangeEvent<HTMLInputElement>) => patch(pid, task.id, { deadline: e.target.value ? e.target.value as ISODateString : null })} className={input} /></Label></div><div className="mt-4 grid gap-4 lg:grid-cols-[1fr_8rem]"><Label text={`進捗率 ${task.progress}%`}><input type="range" min={0} max={100} step={5} value={task.progress} onChange={(e: ChangeEvent<HTMLInputElement>) => changeProgress(pid, task, Number(e.target.value))} className="mt-3 w-full accent-indigo-600" /></Label><Label text="数値入力"><input type="number" min={0} max={100} value={task.progress} onChange={(e: ChangeEvent<HTMLInputElement>) => changeProgress(pid, task, Number(e.target.value))} className={input} /></Label></div><Label text="メモ" cls="mt-4"><textarea rows={3} value={task.memo} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => patch(pid, task.id, { memo: e.target.value })} placeholder="指導教員からの指摘、次に確認することなど" className={`${input} resize-y`} /></Label></div></div></li>;
}

function Header({ title, text, action }: { title: string; text: string; action: ReactNode }) { return <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h1 className="text-2xl font-bold sm:text-3xl">{title}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">{text}</p></div>{action}</section>; }
function Stat({ label, value, detail, alert = false }: { label: string; value: string; detail: string; alert?: boolean }) { return <article className={`rounded-2xl border bg-white p-5 shadow-sm ${alert ? "border-rose-200" : "border-slate-200"}`}><p className="text-sm text-slate-500">{label}</p><p className={`mt-2 text-3xl font-bold ${alert ? "text-rose-700" : "text-slate-950"}`}>{value}</p><p className="mt-2 text-sm text-slate-500">{detail}</p></article>; }
function Bar({ value, light = false }: { value: number; light?: boolean }) { return <div className={`mt-3 h-2.5 overflow-hidden rounded-full ${light ? "bg-indigo-950/40" : "bg-slate-100"}`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}><div className={`h-full rounded-full ${light ? "bg-white" : "bg-indigo-500"}`} style={{ width: `${value}%` }} /></div>; }
function Badge({ text, cls }: { text: string; cls: string }) { return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>{text}</span>; }
function Label({ text, children, cls = "" }: { text: string; children?: ReactNode; cls?: string }) { return <label className={`block ${cls}`}><span className="text-xs font-semibold text-slate-700">{text}</span>{children}</label>; }
function Tasks({ title, entries, empty, alert = false }: { title: string; entries: Entry[]; empty: string; alert?: boolean }) { return <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4 sm:px-6"><h2 className="text-lg font-bold">{title}</h2><Badge text={`${entries.length}件`} cls={alert && entries.length ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-600"} /></div>{entries.length === 0 ? <p className="p-6 text-sm text-slate-500">{empty}</p> : <ol className="divide-y divide-slate-100">{entries.map(({ process, task }) => <li key={task.id} className="p-5 sm:px-6"><div className="flex flex-col gap-3 sm:flex-row sm:justify-between"><div><div className="flex flex-wrap gap-2"><Badge text={`優先度 ${TASK_PRIORITY_LABELS[task.priority]}`} cls={priorityClass(task.priority)} /><span className="text-xs text-slate-500">第{process.order}工程・{process.title}</span></div><h3 className="mt-2 font-semibold">{task.title}</h3><p className="mt-1 text-sm text-slate-500">{task.deadline ? `締切：${new Intl.DateTimeFormat("ja-JP", { month:"numeric", day:"numeric", weekday:"short" }).format(date(task.deadline))}` : "締切未設定"}</p></div><Link href={`/processes#${process.id}`} className="text-sm font-semibold text-indigo-600">編集する</Link></div><Bar value={task.progress} /></li>)}</ol>}</section>; }
