import type { TaskPriority, TaskStatus } from "@/types/thesis";

export type ChoiceCard = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly insertText: string;
  readonly taskUpdate?: {
    readonly taskId: string;
    readonly status?: TaskStatus;
    readonly progress?: number;
    readonly priority?: TaskPriority;
    readonly memo?: string;
  };
};

export type ChatStep = {
  readonly id: string;
  readonly question: string;
  readonly choices: readonly [ChoiceCard, ChoiceCard, ChoiceCard];
};

export type ChatAnswer = {
  readonly id: string;
  readonly stepId: string;
  readonly choiceId: string;
  readonly question: string;
  readonly choiceTitle: string;
  readonly insertText: string;
  readonly answeredAt: string;
  readonly taskUpdate?: ChoiceCard["taskUpdate"];
};
