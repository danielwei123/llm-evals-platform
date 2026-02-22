export type PromptVersion = {
  id: string;
  prompt_id: string;
  version: number;
  content: string;
  parameters?: Record<string, unknown> | null;
  created_at: string;
};

export type RunStatus = 'queued' | 'running' | 'succeeded' | 'failed';

export type Run = {
  id: string;
  prompt_id: string;
  prompt_version: number;
  status: RunStatus;
  input?: Record<string, unknown> | null;
  output?: string | null;
  error?: string | null;
  created_at: string;
  started_at?: string | null;
  finished_at?: string | null;
};

export type RunCreateIn = {
  prompt_name: string;
  input?: Record<string, unknown> | null;
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
