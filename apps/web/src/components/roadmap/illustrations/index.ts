import type { IllustrationId } from "@/lib/roadmap";

import * as classical from "./classical";
import * as deep from "./deep";
import type { Illustration } from "./kit";
import * as modern from "./modern";

/** Every animated illustration by id; `MILESTONE_ILLUSTRATIONS` picks one per milestone. */
export const ILLUSTRATIONS: Record<IllustrationId, Illustration> = {
  ...classical,
  ...deep,
  ...modern,
};
