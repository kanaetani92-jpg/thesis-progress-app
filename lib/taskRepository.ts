// src/lib/taskRepository.ts
import {
  collection,
  doc,
  getDocs,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type TaskStatus =
  | "not_started"
  | "in_progress"
  | "waiting"
  | "completed";

export type TaskPriority = "high" | "medium" | "low";

export type ThesisTask = {
  id: string;
  phaseId: string;
  title: string;
  status: TaskStatus;
  dueDate: string | null;
  memo: string;
  priority: TaskPriority;
};

const DEFAULT_PROJECT_ID = "default-project";

// dbが使える状態か確認する
function getDb() {
  if (!db) {
    throw new Error(
      "Firebaseが設定されていません。環境変数を確認してください。"
    );
  }

  return db;
}

// users/{uid}/projects/default-project/tasks
function getTasksCollection(uid: string) {
  return collection(
    getDb(),
    "users",
    uid,
    "projects",
    DEFAULT_PROJECT_ID,
    "tasks"
  );
}

// Firestoreからタスク一覧を取得する
export async function fetchTasks(uid: string): Promise<ThesisTask[]> {
  const snapshot = await getDocs(getTasksCollection(uid));

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as ThesisTask[];
}

// Firestoreへタスクを保存する
export async function saveTask(uid: string, task: ThesisTask): Promise<void> {
  const taskRef = doc(
    getDb(),
    "users",
    uid,
    "projects",
    DEFAULT_PROJECT_ID,
    "tasks",
    task.id
  );

  await setDoc(
    taskRef,
    {
      ...task,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}