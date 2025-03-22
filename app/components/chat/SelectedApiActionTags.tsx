import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { chatStore } from '~/lib/stores/chat';
import type { ApiActions } from '~/types/ApiTypes';
import { Dialog, DialogRoot } from '~/components/ui/Dialog';
import { ApiActionsList } from './ApiActionsList';
import { Button } from '~/components/ui/Button';

export function SelectedApiActionTags() {
  const selectedApiActions = useStore(chatStore).selectedApiActions as ApiActions[];
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);

  const handleOpenApiModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsApiModalOpen(true);
  };

  return (
    <>
      <div className="flex flex-wrap gap-1 mb-2 px-2">
        {selectedApiActions.map((api) => (
          <div
            key={api.id}
            className="text-xs px-2 py-1 rounded-md bg-bolt-elements-background-depth-3 text-bolt-elements-textSecondary flex items-center group relative cursor-default"
          >
            <span className="i-ph:plug text-xs mr-1 group-hover:hidden"></span>
            <button
              className="i-ph:x text-xs mr-1 hidden group-hover:inline-block text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary"
              onClick={(e) => {
                e.stopPropagation();

                const updatedSelectedApis = selectedApiActions.filter((a) => a.id !== api.id);
                chatStore.setKey('selectedApiActions', updatedSelectedApis);
              }}
              aria-label={`Remove ${api.name} API action`}
            />
            {api.name}
          </div>
        ))}

        {/* Add API Actions button */}
        <button
          onClick={handleOpenApiModal}
          className="text-xs px-3 py-1 rounded-md border border-dashed border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-2 flex items-center gap-1 cursor-pointer transition-colors"
          aria-label="Add API Actions"
        >
          <span className="i-ph:plus-circle-fill text-xs"></span>
          <span>Add API Actions</span>
        </button>
      </div>

      {/* API Actions Modal */}
      <DialogRoot open={isApiModalOpen}>
        <Dialog
          className="sm:max-w-5xl md:max-w-6xl lg:max-w-7xl w-[95vw] rounded-xl"
          onClose={() => setIsApiModalOpen(false)}
        >
          <div className="p-6 max-h-[80vh] overflow-y-auto">
            <ApiActionsList />
          </div>
          <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
            <Button className="rounded-full" onClick={() => setIsApiModalOpen(false)}>
              Done
            </Button>
          </div>
        </Dialog>
      </DialogRoot>
    </>
  );
}
