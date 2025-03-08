import React from 'react';

import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '~/components/ui/Button';
import EditActionsModal from './EditApiActionsModal';
import { Dialog, DialogRoot, DialogTitle, DialogDescription } from '~/components/ui/Dialog';

interface ApiConfig {
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

export function ApiActionsList() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [apis, setApis] = useState<ApiConfig[]>([]);
  const [editingApiId, setEditingApiId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingApiId, setDeletingApiId] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const handleAddApi = () => {
    setEditingApiId(null);
    setIsModalOpen(true);
  };

  const handleEditApi = (id: string) => {
    setEditingApiId(id);
    setIsModalOpen(true);
  };

  const handleSaveApi = (apiConfig: ApiConfig) => {
    if (editingApiId) {
      // Update existing API
      setApis(apis.map((api) => (api.id === editingApiId ? apiConfig : api)));
    } else {
      // Add new API
      setApis([...apis, { ...apiConfig, id: `api-${Date.now()}` }]);
    }

    setIsModalOpen(false);
  };

  const handleDeleteApi = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the edit modal
    setDeletingApiId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteApi = () => {
    if (deletingApiId) {
      setApis(apis.filter((api) => api.id !== deletingApiId));
      setDeleteDialogOpen(false);
      setDeletingApiId(null);
    }
  };

  const toggleRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the edit modal
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <main className="container mx-auto mb-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">API Actions</h1>
        <Button onClick={handleAddApi} className="rounded-full flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add API
        </Button>
      </div>

      {apis.length === 0 ? (
        <div className="text-center py-8 border rounded-lg bg-gray-50 flex flex-col items-center justify-center">
          <h3 className="text-lg font-medium mb-2">No APIs configured yet</h3>
          <p className="text-gray-500 mb-6 max-w-md">Add your first API to start configuring actions for your GPT</p>
          <Button onClick={handleAddApi} className="rounded-full flex items-center gap-2 px-6" size="lg">
            <Plus className="h-4 w-4" />
            Add your first API
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="w-10 py-3 px-2"></th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">API Name</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Server URL</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Authentication</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Actions</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Options</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {apis.map((api, index) => (
                <React.Fragment key={api.id ?? `api-${index}`}>
                  <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => handleEditApi(api.id!)}>
                    <td className="py-4 px-2 text-center">
                      <Button
                        size="icon"
                        className="rounded-full bg-transparent"
                        onClick={(e) => toggleRow(api.id!, e)}
                      >
                        {api.id && expandedRows[api.id] ? (
                          <ChevronDown className="h-6 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-6 text-gray-500" />
                        )}
                      </Button>
                    </td>
                    <td className="py-4 px-4 font-medium">{api.name || 'Unnamed API'}</td>
                    <td className="py-4 px-4 text-gray-500 font-mono text-sm truncate max-w-[200px]">
                      {api.serverUrl || <span className="text-gray-400">Not specified</span>}
                    </td>
                    <td className="py-4 px-4 text-gray-500">
                      {api.authType === 'none' ? 'No authentication' : api.authType === 'apiKey' ? 'API Key' : 'OAuth'}
                    </td>
                    <td className="py-4 px-4 text-gray-500">
                      {api.actions.length > 0 ? (
                        <span>
                          {api.actions.length} action{api.actions.length !== 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-gray-400">No actions</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full h-8 w-8 text-gray-500 hover:text-red-500 hover:bg-red-50"
                        onClick={(e) => handleDeleteApi(api.id!, e)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                  {api.id && expandedRows[api.id] && api.actions.length > 0 && (
                    <tr>
                      <td colSpan={6} className="bg-gray-50 p-0">
                        <div className="py-2 px-6 border-t border-gray-100">
                          <h4 className="font-medium text-xs mb-1">Available Actions</h4>
                          <div className="grid grid-cols-[1fr_auto_2fr_2fr] gap-x-4 gap-y-2 text-sm">
                            <div className="text-gray-500 uppercase">Name</div>
                            <div className="text-gray-500 uppercase">Method</div>
                            <div className="text-gray-500 uppercase pl-2">Path</div>
                            <div className="text-gray-500 uppercase">Summary</div>

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

      <EditActionsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveApi}
        editingApi={editingApiId ? apis.find((api) => api.id === editingApiId) : undefined}
      />

      {/* Delete Confirmation Dialog */}
      <DialogRoot open={deleteDialogOpen}>
        <Dialog className="sm:max-w-md rounded-xl" onClose={() => setDeleteDialogOpen(false)}>
          <div className="p-6 pb-2">
            <DialogTitle>Delete API Action</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this API action? This action cannot be undone.
            </DialogDescription>
          </div>
          <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
            <Button variant="outline" className="rounded-full px-6" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" className="rounded-full px-6" onClick={confirmDeleteApi}>
              Delete
            </Button>
          </div>
        </Dialog>
      </DialogRoot>
    </main>
  );
}
