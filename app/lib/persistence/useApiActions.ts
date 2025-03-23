import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { db } from './useChatHistory';
import { logStore } from '~/lib/stores/logs';
import { getAllApiActions, saveApiAction, deleteApiActionById, saveApiActions } from './db';
import type { ApiActions } from '~/types/ApiTypes';

/**
 * Hook for managing API actions in IndexedDB
 */
export function useApiActions() {
  const [apiActions, setApiActions] = useState<ApiActions[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Function to load API actions from IndexedDB
  const loadApiActions = useCallback(async () => {
    if (!db) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const actions = await getAllApiActions(db);
      setApiActions(actions || []);
    } catch (error) {
      logStore.logError('Failed to load API actions', error as Error, {
        component: 'ApiActions',
        action: 'load',
        type: 'error',
        message: 'Failed to load API actions from IndexedDB',
      });
      toast.error('Failed to load API actions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load API actions on initial mount
  useEffect(() => {
    loadApiActions();
  }, [loadApiActions]);

  // Refresh API actions - can be called manually to refresh the data
  const refreshActions = useCallback(() => {
    return loadApiActions();
  }, [loadApiActions]);

  // Save a single API action
  const saveAction = useCallback(async (action: ApiActions): Promise<string | undefined> => {
    if (!db) {
      toast.error('Database is not available');
      return undefined;
    }

    try {
      const id = await saveApiAction(db, action);

      // Update the local state
      setApiActions((prev) => {
        const exists = prev.findIndex((a) => a.id === action.id);

        if (exists >= 0) {
          return prev.map((a) => (a.id === action.id ? action : a));
        } else {
          return [...prev, { ...action, id }];
        }
      });

      return id;
    } catch (error) {
      logStore.logError('Failed to save API action', error as Error, {
        component: 'ApiActions',
        action: 'save',
        type: 'error',
        message: 'Failed to save API action to IndexedDB',
      });
      toast.error('Failed to save API action');

      return undefined;
    }
  }, []);

  // Save multiple API actions
  const saveActions = useCallback(async (actions: ApiActions[]): Promise<string[] | undefined> => {
    if (!db) {
      toast.error('Database is not available');
      return undefined;
    }

    try {
      const ids = await saveApiActions(db, actions);

      // Update the local state
      setApiActions((prev) => {
        const newActions = [...prev];

        for (let i = 0; i < actions.length; i++) {
          const action = { ...actions[i], id: ids[i] };
          const existingIndex = newActions.findIndex((a) => a.id === action.id);

          if (existingIndex >= 0) {
            newActions[existingIndex] = action;
          } else {
            newActions.push(action);
          }
        }

        return newActions;
      });

      return ids;
    } catch (error) {
      logStore.logError('Failed to save API actions', error as Error, {
        component: 'ApiActions',
        action: 'saveMultiple',
        type: 'error',
        message: 'Failed to save multiple API actions to IndexedDB',
      });
      toast.error('Failed to save API actions');

      return undefined;
    }
  }, []);

  // Delete an API action
  const deleteAction = useCallback(async (id: string): Promise<boolean> => {
    if (!db) {
      toast.error('Database is not available');
      return false;
    }

    try {
      await deleteApiActionById(db, id);

      // Update the local state
      setApiActions((prev) => prev.filter((a) => a.id !== id));

      return true;
    } catch (error) {
      logStore.logError('Failed to delete API action', error as Error, {
        component: 'ApiActions',
        action: 'delete',
        type: 'error',
        message: 'Failed to delete API action from IndexedDB',
      });
      toast.error('Failed to delete API action');

      return false;
    }
  }, []);

  return {
    apiActions,
    isLoading,
    saveAction,
    saveActions,
    deleteAction,
    refreshActions,
  };
}
