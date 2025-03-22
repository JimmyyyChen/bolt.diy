import { useStore } from '@nanostores/react';
import { chatStore } from '~/lib/stores/chat';
import type { ApiActions } from '~/types/ApiTypes';

export function SelectedApiActionTags() {
  const selectedApiActions = useStore(chatStore).selectedApiActions as ApiActions[];

  if (selectedApiActions.length === 0) {
    return null;
  }

  return (
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
    </div>
  );
}
