export type ContextAnnotation =
  | {
      type: 'codeContext';
      files: string[];
    }
  | {
      type: 'chatSummary';
      summary: string;
      chatId: string;
    };

export type ProgressAnnotation = {
  type: 'progress';
  label: string;
  status: 'in-progress' | 'complete';
  order: number;
  message: string;
};

export type ToolInvocationAnnotation = {
  type: 'toolInvocation';
  toolName: string;
  parameters: Record<string, any>;
  result: any;
};

export type ApiActionsAnnotation = {
  type: 'apiActions';
  actions: Array<{
    name: string;
    method: string;
    path: string;
    summary: string;
    serverUrl?: string;
  }>;
};

export type TestActionsAnnotation = {
  type: 'testActions';
  actions: Array<{
    name: string;
    filePath: string;
    content: string;
    summary?: string;
  }>;
};
