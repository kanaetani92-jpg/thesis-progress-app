export type CompanionActionId =
  | "start-thesis"
  | "resume-session"
  | "diagnose-blocker"
  | "plan-from-deadline";

export type CompanionAction = {
  readonly id: CompanionActionId;
  readonly label: string;
  readonly description: string;
  readonly href: string;
  readonly status: "placeholder" | "available";
};
