import { initialThesisProcesses } from "@/data/initial-thesis-processes";
import type { TaskPriority, ThesisTask } from "@/types/thesis";

export const DEFAULT_PROJECT_ID = "default-project";

export type InitialTask = ThesisTask & {
  readonly processId: string;
  readonly processOrder: number;
  readonly priority: TaskPriority;
};

export const initialTasks: readonly InitialTask[] = initialThesisProcesses.flatMap((process) =>
  process.tasks.map((task) => ({
    ...task,
    processId: process.id,
    processOrder: process.order,
    priority: task.priority ?? "medium",
  })),
);
