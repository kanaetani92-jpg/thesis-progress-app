import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  type Firestore,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type UserSettings = {
  readonly displayName: string;
  readonly email: string | null;
  readonly photoURL?: string | null;
  readonly locale: "ja";
};

function getDb(): Firestore {
  if (!db) {
    throw new Error("Firestoreが初期化されていません。Firebase環境変数を.env.localに設定してください。");
  }
  return db;
}

function profileDocument(uid: string) {
  return doc(getDb(), "users", uid, "settings", "profile");
}

export async function getUserSettings(uid: string): Promise<UserSettings | null> {
  const snapshot = await getDoc(profileDocument(uid));
  if (!snapshot.exists()) return null;
  return snapshot.data() as UserSettings;
}

export async function saveUserSettings(uid: string, settings: UserSettings): Promise<void> {
  await setDoc(profileDocument(uid), {
    ...settings,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function initializeUserSettingsIfEmpty(uid: string, settings: UserSettings): Promise<boolean> {
  const snapshot = await getDoc(profileDocument(uid));
  if (snapshot.exists()) return false;

  await setDoc(profileDocument(uid), {
    ...settings,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return true;
}
