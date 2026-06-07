import type { CompanionActionId } from "@/types/companion";

export function companionActionHref(actionId: CompanionActionId): string {
  return `/?action=${actionId}`;
}
