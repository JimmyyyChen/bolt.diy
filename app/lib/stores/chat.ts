import { map } from 'nanostores';
import type { ApiActions } from '~/types/ApiTypes';

export const chatStore = map({
  started: false,
  aborted: false,
  showChat: true,
  selectedApiActions: [] as ApiActions[],
});
