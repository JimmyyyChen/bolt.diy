import React, { useState, useEffect } from 'react';
import { Dialog, DialogRoot } from '~/components/ui/Dialog';
import { Button } from '~/components/ui/Button';
import { Plus, Trash2, Check, Edit2 } from 'lucide-react';
import { DialogTitle, DialogDescription } from '~/components/ui/Dialog';
import type { ApiActions } from '~/types/ApiTypes';
import { useApiActions } from '~/lib/persistence/useApiActions';
import { toast } from 'react-toastify';
import { logStore } from '~/lib/stores/logs';
import { chatStore } from '~/lib/stores/chat';
import { useStore } from '@nanostores/react';
import EditActionsModal from './EditApiActionsModal';
import { useTranslation } from 'react-i18next';

export function ApiActionsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const { apiActions: apis, isLoading, saveAction, deleteAction, refreshActions } = useApiActions();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingApiId, setEditingApiId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingApiId, setDeletingApiId] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const selectedApiActions = useStore(chatStore).selectedApiActions as ApiActions[];

  // Always fetch fresh data when modal opens
  useEffect(() => {
    if (isOpen) {
      refreshActions();
    }
  }, [isOpen, refreshActions]);

  // Refresh the data when the edit modal is closed
  useEffect(() => {
    if (!isEditModalOpen && editingApiId) {
      // Reset editingApiId and refresh the data
      setEditingApiId(null);
      refreshActions();
    }
  }, [isEditModalOpen, editingApiId, refreshActions]);

  const handleAddApi = () => {
    setEditingApiId(null);
    setIsEditModalOpen(true);
  };

  const handleEditApi = (id: string) => {
    setEditingApiId(id);
    setIsEditModalOpen(true);
  };

  const handleAfterSave = (apiConfig: ApiActions) => {
    // Ensure the API is selected in the chat
    if (apiConfig.id && !selectedApiActions.some((api) => api.id === apiConfig.id)) {
      chatStore.setKey('selectedApiActions', [...selectedApiActions, apiConfig]);
    }

    // Expand the row to show actions
    if (apiConfig.id) {
      setExpandedRows((prev) => ({
        ...prev,
        [apiConfig.id as string]: true,
      }));
    }

    // Close the edit modal
    setIsEditModalOpen(false);
  };

  const handleSaveApi = async (apiConfig: ApiActions) => {
    try {
      if (editingApiId) {
        // Update existing API
        await saveAction({ ...apiConfig, id: editingApiId });
      } else {
        // Add new API
        await saveAction(apiConfig);
      }

      // Update selected API actions if the edited API is already selected
      const isSelected = selectedApiActions.some((api) => api.id === apiConfig.id);

      if (isSelected) {
        const updatedSelectedApis = selectedApiActions.map((api) => (api.id === apiConfig.id ? apiConfig : api));
        chatStore.setKey('selectedApiActions', updatedSelectedApis);
      }

      // Refresh API data
      refreshActions();
    } catch (error) {
      logStore.logError('Failed to save API action', error as Error);
      toast.error(t('apiActions.failedToSave'));
    }
  };

  const handleDeleteApi = (id: string) => {
    setDeletingApiId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteApi = async () => {
    if (deletingApiId) {
      try {
        const success = await deleteAction(deletingApiId);

        if (!success) {
          toast.error(t('apiActions.failedToDelete'));
        } else {
          // Remove from selected API actions if it exists
          const isSelected = selectedApiActions.some((api) => api.id === deletingApiId);

          if (isSelected) {
            const updatedSelectedApis = selectedApiActions.filter((api) => api.id !== deletingApiId);
            chatStore.setKey('selectedApiActions', updatedSelectedApis);
          }

          // Refresh API data
          refreshActions();
        }
      } catch (error) {
        logStore.logError('Failed to delete API action', error as Error);
        toast.error(t('apiActions.failedToDelete'));
      }

      setDeleteDialogOpen(false);
      setDeletingApiId(null);
    }
  };

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const addApiToChat = (api: ApiActions) => {
    // Check if API is already in the selected list
    const isAlreadySelected = selectedApiActions.some((selectedApi) => selectedApi.id === api.id);

    if (isAlreadySelected) {
      // Remove from selected list
      const updatedSelectedApis = selectedApiActions.filter((selectedApi) => selectedApi.id !== api.id);
      chatStore.setKey('selectedApiActions', updatedSelectedApis);
    } else {
      // Add to selected list
      chatStore.setKey('selectedApiActions', [...selectedApiActions, api]);
    }
  };

  // Add a new function to handle row clicks
  const handleRowClick = (e: React.MouseEvent, api: ApiActions) => {
    // Prevent toggling the API if clicking on a button or other interactive element
    if (e.target instanceof HTMLElement && (e.target.closest('button') || e.target.closest('[role="checkbox"]'))) {
      return;
    }

    // Toggle the API selection
    addApiToChat(api);
  };

  // Helper function to check if API is selected
  const isApiSelected = (apiId: string) => {
    return selectedApiActions.some((api) => api.id === apiId);
  };

  // Helper function to get auth display text and icon
  const getAuthDisplay = (api: ApiActions) => {
    switch (api.authType) {
      case 'none':
        return t('apiActions.noAuthentication');
      case 'apiKey':
        return t('apiActions.apiKey');
      case 'other':
        return api.otherAuth?.description || t('apiActions.customAuth');
      default:
        return t('apiActions.unknown');
    }
  };

  const renderApiList = () => {
    if (isLoading) {
      return <div className="p-4 text-center">{t('common.loading')}</div>;
    }

    return (
      <main className="container mx-auto mb-4">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{t('apiActions.title')}</h1>
          </div>
          <Button onClick={handleAddApi} className="rounded-full flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {t('apiActions.addApi')}
          </Button>
        </div>

        {apis.length === 0 ? (
          <div className="text-center py-8 border rounded-lg bg-gray-50 flex flex-col items-center justify-center">
            <h3 className="text-lg font-medium mb-2">{t('apiActions.noApisConfigured')}</h3>
            <p className="text-gray-500 mb-2 max-w-md">{t('apiActions.noApisDescription')}</p>
            <p className="text-gray-500 mb-6 max-w-md text-sm">{t('apiActions.selectApisDescription')}</p>
            <Button onClick={handleAddApi} className="rounded-full flex items-center gap-2 px-6" size="lg">
              <Plus className="h-4 w-4" />
              {t('apiActions.addFirstApi')}
            </Button>
          </div>
        ) : (
          <div className="border rounded-lg overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="w-10 py-3 px-2 text-center">{t('apiActions.use')}</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">{t('apiActions.apiName')}</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">{t('apiActions.serverUrl')}</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">{t('apiActions.authentication')}</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">{t('apiActions.actions')}</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">{t('apiActions.options')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {apis.map((api, index) => (
                  <React.Fragment key={api.id ?? `api-${index}`}>
                    <tr
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={(e) => handleRowClick(e, api)}
                    >
                      <td className="py-4 px-2 text-center">
                        <div
                          className={`w-5 h-5 rounded border flex items-center justify-center cursor-pointer mx-auto
                          ${isApiSelected(api.id!) ? 'bg-blue-500 border-blue-500' : 'border-gray-300 hover:border-blue-500'}`}
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent row click from triggering
                            addApiToChat(api);
                          }}
                          role="checkbox"
                          aria-checked={isApiSelected(api.id!)}
                          aria-label={`Use ${api.name} in chat`}
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              addApiToChat(api);
                            }
                          }}
                        >
                          {isApiSelected(api.id!) && <Check className="h-3 w-3 text-white" />}
                        </div>
                      </td>
                      <td className="py-4 px-4 font-medium">{api.name || 'Unnamed API'}</td>
                      <td className="py-4 px-4 text-gray-500 font-mono text-sm truncate max-w-[200px]">
                        {api.serverUrl || <span className="text-gray-400">{t('apiActions.notSpecified')}</span>}
                      </td>
                      <td className="py-4 px-4 text-gray-500">
                        <div className="flex items-center">{getAuthDisplay(api)}</div>
                      </td>
                      <td className="py-4 px-4 text-gray-500">
                        {api.actions.length > 0 ? (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent row click from triggering
                              toggleRow(api.id!);
                            }}
                          >
                            {api.actions.length} {t('apiActions.actions')}
                          </Button>
                        ) : (
                          <span className="text-gray-400">{t('apiActions.noActions')}</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right flex items-center justify-end gap-2">
                        <Button
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent row click from triggering
                            handleEditApi(api.id!);
                          }}
                          title={t('apiActions.editApi')}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full h-8 w-8 text-gray-500 hover:text-red-500 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent row click from triggering
                            handleDeleteApi(api.id!);
                          }}
                          title={t('apiActions.deleteApi')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                    {api.id && expandedRows[api.id] && api.actions.length > 0 && (
                      <tr>
                        <td colSpan={6} className="bg-gray-50 p-0">
                          <div className="py-2 px-6 border-t border-gray-100">
                            <div className="grid grid-cols-[1fr_auto_2fr_2fr] gap-x-4 gap-y-2 text-sm">
                              {api.actions.map((action, index) => (
                                <React.Fragment key={`action-${index}`}>
                                  <div className="font-medium truncate" title={action.name}>
                                    {action.name}
                                  </div>
                                  <div className="px-1 py-0.5 bg-gray-100 rounded text-xs font-medium text-gray-600 inline-block w-fit">
                                    {action.method}
                                  </div>
                                  <div className="font-mono text-xs truncate pl-2" title={action.path}>
                                    {action.path}
                                  </div>
                                  <div className="text-gray-600 truncate" title={action.summary || '-'}>
                                    {action.summary || '-'}
                                  </div>
                                </React.Fragment>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    );
  };

  return (
    <>
      <DialogRoot open={isOpen}>
        <Dialog className="sm:max-w-5xl md:max-w-6xl lg:max-w-7xl w-[95vw] rounded-xl" onClose={onClose}>
          <div className="p-6 max-h-[80vh] overflow-y-auto">{renderApiList()}</div>
          <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
            <Button className="rounded-full" onClick={onClose}>
              {t('apiActions.done')}
            </Button>
          </div>
        </Dialog>
      </DialogRoot>

      <EditActionsModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveApi}
        onAfterSave={handleAfterSave}
        editingApi={editingApiId ? apis.find((api) => api.id === editingApiId) : undefined}
      />

      {/* Delete Confirmation Dialog */}
      <DialogRoot open={deleteDialogOpen}>
        <Dialog className="sm:max-w-md rounded-xl" onClose={() => setDeleteDialogOpen(false)}>
          <div className="p-6 pb-2">
            <DialogTitle>{t('apiActions.deleteApi')}</DialogTitle>
            <DialogDescription>{t('apiActions.deleteConfirmation')}</DialogDescription>
          </div>
          <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
            <Button variant="outline" className="rounded-full px-6" onClick={() => setDeleteDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" className="rounded-full px-6" onClick={confirmDeleteApi}>
              {t('common.delete')}
            </Button>
          </div>
        </Dialog>
      </DialogRoot>
    </>
  );
}
