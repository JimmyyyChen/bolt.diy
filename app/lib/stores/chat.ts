import { map } from 'nanostores';
import type { ApiActions } from '~/types/ApiTypes';
import type { TestCodeItem } from '~/types/test';

export const chatStore = map({
  started: false,
  aborted: false,
  showChat: true,
  selectedApiActions: [] as ApiActions[],
  testCodes: [] as TestCodeItem[],
});
