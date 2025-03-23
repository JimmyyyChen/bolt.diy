import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { chatStore } from '~/lib/stores/chat';
import { ContextTags } from './ContextTag';
import { AddTestModal } from './AddTestModal';
import type { TestCodeItem } from '~/types/test';

export function TestContextTags() {
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState<string | undefined>();
  const { testCodes = [] } = useStore(chatStore);

  const handleAddTest = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTestId(undefined);
    setIsTestModalOpen(true);
  };

  const handleEditTest = (e: React.MouseEvent, test: TestCodeItem) => {
    e.stopPropagation();
    setSelectedTestId(test.id);
    setIsTestModalOpen(true);
  };

  const handleRemoveTestCode = (id: string) => {
    const updatedTestCodes = testCodes.filter((test: TestCodeItem) => test.id !== id);
    chatStore.setKey('testCodes', updatedTestCodes);
  };

  return (
    <>
      <ContextTags
        items={testCodes}
        onRemove={handleRemoveTestCode}
        onAddClick={handleAddTest}
        onItemClick={handleEditTest}
        tagIcon="i-ph:code"
        addButtonText="Add Test Code"
        addButtonIcon="i-ph:code-fill"
      />
      <AddTestModal isOpen={isTestModalOpen} onClose={() => setIsTestModalOpen(false)} testId={selectedTestId} />
    </>
  );
}
