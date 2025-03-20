export interface ApiKeyAuth {
  key?: string;
  authType: 'basic' | 'bearer' | 'custom';
  customHeaderName?: string;
}

export interface OtherAuth {
  description?: string;
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
}

export interface ApiActions {
  id?: string;
  name: string;
  actions: Array<{
    name: string;
    method: string;
    path: string;
    summary: string;
  }>;
  authType: 'none' | 'apiKey' | 'other';
  schema: string;
  serverUrl?: string;
  apiKeyAuth?: ApiKeyAuth;
  otherAuth?: OtherAuth;
}
