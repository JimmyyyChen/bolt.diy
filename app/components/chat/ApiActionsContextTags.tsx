import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { chatStore } from '~/lib/stores/chat';
import { ContextTags } from './ContextTag';
import { ApiActionsModal } from './ApiActionsModal';
import EditActionsModal from './EditApiActionsModal';
import type { ApiActions } from '~/types/ApiTypes';
import { useApiActions } from '~/lib/persistence/useApiActions';
import { toast } from 'react-toastify';
import { logStore } from '~/lib/stores/logs';
import { useTranslation } from 'react-i18next';

export function ApiActionsContextTags() {
  const { t } = useTranslation();
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingApi, setEditingApi] = useState<ApiActions | undefined>();
  const selectedApiActions = useStore(chatStore).selectedApiActions as ApiActions[];
  const { apiActions: storedApis, saveAction, isLoading, refreshActions } = useApiActions();

  // Ensure each API action has a required id
  const apiActionsWithId = selectedApiActions.map((api) => ({
    ...api,
    id: api.id || `api-${api.name}-${Date.now()}`,
  }));

  const handleOpenApiModal = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Refresh API data before opening the modal
    refreshActions();
    setIsApiModalOpen(true);
  };

  const handleItemClick = (e: React.MouseEvent, api: ApiActions) => {
    e.stopPropagation();

    // Look up the API from the database to ensure we're editing the latest version
    refreshActions().then(() => {
      if (!isLoading && storedApis) {
        const storedApi = storedApis.find((a) => a.id === api.id);
        setEditingApi(storedApi || api);
      } else {
        setEditingApi(api);
      }

      setIsEditModalOpen(true);
    });
  };

  const handleSaveApi = async (updatedApi: ApiActions) => {
    try {
      // First, save to the database
      await saveAction(updatedApi);

      // Then update the local state in the chat store
      const updatedApiActions = selectedApiActions.map((api) => (api.id === updatedApi.id ? updatedApi : api));
      chatStore.setKey('selectedApiActions', updatedApiActions);

      // Refresh API data
      await refreshActions();

      setIsEditModalOpen(false);
    } catch (error) {
      logStore.logError('Failed to save API action', error as Error);
      toast.error(t('apiActions.failedToSave'));
    }
  };

  const handleRemoveApiAction = (id: string) => {
    const updatedSelectedApis = selectedApiActions.filter((api) => api.id !== id);
    chatStore.setKey('selectedApiActions', updatedSelectedApis);
  };

  // Clean up the editing state when the modal is closed
  useEffect(() => {
    if (!isEditModalOpen) {
      setEditingApi(undefined);
    }
  }, [isEditModalOpen]);

  return (
    <>
      <ContextTags
        items={apiActionsWithId}
        onRemove={handleRemoveApiAction}
        onAddClick={handleOpenApiModal}
        onItemClick={handleItemClick}
        tagIcon="i-ph:plug"
        addButtonText={t('apiActions.addAction')}
        addButtonIcon="i-ph:plus-circle-fill"
      />
      <ApiActionsModal isOpen={isApiModalOpen} onClose={() => setIsApiModalOpen(false)} />
      {editingApi && (
        <EditActionsModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveApi}
          editingApi={editingApi}
        />
      )}
    </>
  );
}
