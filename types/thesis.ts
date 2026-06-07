export type TaskStatus =
  | "not_started"
  | "in_progress"
  | "waiting_for_review"
  | "completed"
  | "on_hold";

export type TaskPriority = "low" | "medium" | "high";

export type ISODateString = `${number}-${number}-${number}`;

export interface ThesisTask {
  readonly id: string;
  readonly order: number;
  readonly title: string;
  readonly description: string;
  readonly status: TaskStatus;
  readonly progress: number;
  readonly deadline: ISODateString | null;
  readonly memo: string;
  readonly isInitial: boolean;
  readonly priority?: TaskPriority;
}

export interface ThesisProcess {
  readonly id: string;
  readonly order: number;
  readonly title: string;
  readonly description: string;
  readonly tasks: readonly ThesisTask[];
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  not_started: "未着手",
  in_progress: "作業中",
  waiting_for_review: "確認待ち",
  completed: "完了",
  on_hold: "保留",
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "低",
  medium: "中",
  high: "高",
};
