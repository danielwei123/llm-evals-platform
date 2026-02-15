export type PromptVersion = {
  id: string;
  prompt_id: string;
  version: number;
  content: string;
  parameters?: Record<string, unknown> | null;
  created_at: string;
};

export type PromptListItem = {
  id: string;
  name: string;
  description?: string | null;
  created_at: string;
  active_version: number;
  latest_version?: PromptVersion | null;
};

export type PromptDetail = {
  id: string;
  name: string;
  description?: string | null;
  created_at: string;
  active_version: number;
  versions: PromptVersion[];
};

export type PromptCreateIn = {
  name: string;
  description?: string | null;
  content: string;
  parameters?: Record<string, unknown> | null;
};

export type PromptUpdateIn = {
  description?: string | null;
};

export type PromptVersionCreateIn = {
  content: string;
  parameters?: Record<string, unknown> | null;
};
