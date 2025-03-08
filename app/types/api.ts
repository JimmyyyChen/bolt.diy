/**
 * API-related type definitions
 */

export interface ApiConfig {
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

export interface ApiKeysMap {
  [key: string]: string;
}
