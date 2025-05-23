import React from 'react';
import type { Message } from 'ai';
import { toast } from 'react-toastify';
import { Button } from '~/components/ui/Button';
import { classNames } from '~/utils/classNames';
import { useTranslation } from 'react-i18next';

interface ChatData {
  messages: Message[];
  description?: string;
}

interface ExampleChatButtonProps {
  importChat?: (description: string, messages: Message[]) => Promise<void>;
  path: string;
  buttonTextKey: string;
}

export function ExampleChatButton({ importChat, path, buttonTextKey }: ExampleChatButtonProps) {
  const { t } = useTranslation();

  const loadExampleChat = async () => {
    if (!importChat) {
      toast.error('Import function not available');
      return;
    }

    try {
      const response = await fetch(path);

      if (!response.ok) {
        throw new Error(`Failed to fetch example chat: ${response.statusText}`);
      }

      const data = await response.json();
      const isChatData = (obj: unknown): obj is ChatData =>
        obj !== null && typeof obj === 'object' && 'messages' in obj && Array.isArray((obj as any).messages);

      if (!isChatData(data)) {
        throw new Error('Invalid example chat format');
      }

      await importChat(data.description || 'Example Chat', data.messages);
      toast.success('Example chat loaded successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load example chat');
    }
  };

  return (
    <Button
      onClick={loadExampleChat}
      variant="outline"
      size="lg"
      className={classNames(
        'gap-2 bg-bolt-elements-background-depth-1',
        'text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-2',
        'border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)]',
        'h-10 px-4 py-2 min-w-[120px] justify-center transition-all duration-200 ease-in-out',
      )}
    >
      <span className="i-ph:lightning w-4 h-4" />
      {t(buttonTextKey)}
    </Button>
  );
}
