/**
 * API-related type definitions
 */

export interface ApiActions {
  id?: string;
  name: string;
  actions: Array<{
    name: string;
    method: string;
    path: string;
    summary: string;
  }>;
  authType: string;
  schema: string;
  serverUrl?: string;
}

// TODO
export interface ApiKeysMap {
  [key: string]: string;
}
