import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  writeBatch,
  type Firestore,
} from "firebase/firestore";
import { DEFAULT_PROJECT_ID, type InitialTask } from "@/data/initialTasks";
import { db } from "@/lib/firebase";
import type { ThesisTask } from "@/types/thesis";

export type FirestoreTask = ThesisTask & {
  readonly processId?: string;
  readonly processOrder?: number;
};

function getDb(): Firestore {
  if (!db) {
    throw new Error("Firestoreが初期化されていません。Firebase環境変数を.env.localに設定してください。");
  }
  return db;
}

function tasksCollection(uid: string, projectId = DEFAULT_PROJECT_ID) {
  return collection(getDb(), "users", uid, "projects", projectId, "tasks");
}

function taskDocument(uid: string, taskId: string, projectId = DEFAULT_PROJECT_ID) {
  return doc(getDb(), "users", uid, "projects", projectId, "tasks", taskId);
}

export async function getTasks(uid: string, projectId = DEFAULT_PROJECT_ID): Promise<FirestoreTask[]> {
  const snapshot = await getDocs(query(tasksCollection(uid, projectId), orderBy("processOrder"), orderBy("order")));
  return snapshot.docs.map((taskSnapshot) => taskSnapshot.data() as FirestoreTask);
}

export async function saveTask(uid: string, task: FirestoreTask, projectId = DEFAULT_PROJECT_ID): Promise<void> {
  await setDoc(taskDocument(uid, task.id, projectId), {
    ...task,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function saveTasks(uid: string, tasks: readonly FirestoreTask[], projectId = DEFAULT_PROJECT_ID): Promise<void> {
  const batch = writeBatch(getDb());

  tasks.forEach((task) => {
    batch.set(taskDocument(uid, task.id, projectId), {
      ...task,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  });

  await batch.commit();
}

export async function initializeTasksIfEmpty(uid: string, tasks: readonly InitialTask[], projectId = DEFAULT_PROJECT_ID): Promise<boolean> {
  const existing = await getDocs(tasksCollection(uid, projectId));
  if (!existing.empty) return false;

  const batch = writeBatch(getDb());
  tasks.forEach((task) => {
    batch.set(taskDocument(uid, task.id, projectId), {
      ...task,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  await batch.commit();
  return true;
}
