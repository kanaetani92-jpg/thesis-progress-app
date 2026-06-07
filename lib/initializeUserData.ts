import type { User } from "firebase/auth";
import { DEFAULT_PROJECT_ID, initialTasks } from "@/data/initialTasks";
import { initializeTasksIfEmpty } from "@/lib/taskRepository";
import {
  initializeUserSettingsIfEmpty,
  type UserSettings,
} from "@/lib/userSettingsRepository";

function createDefaultSettings(user: User): UserSettings {
  return {
    displayName: user.displayName || (user.isAnonymous ? "ゲスト" : "利用者"),
    email: user.email,
    photoURL: user.photoURL,
    locale: "ja",
  };
}

export async function initializeUserData(user: User, projectId = DEFAULT_PROJECT_ID): Promise<void> {
  await Promise.all([
    initializeUserSettingsIfEmpty(user.uid, createDefaultSettings(user)),
    initializeTasksIfEmpty(user.uid, initialTasks, projectId),
  ]);
}
