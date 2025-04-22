import React from 'react';
import { useTranslation } from 'react-i18next';

const EXAMPLE_PROMPTS = {
  en: [
    { text: 'Build a todo app in React using Tailwind' },
    { text: 'Build a simple blog using Astro' },
    { text: 'Create a cookie consent form using Material UI' },
    { text: 'Make a space invaders game' },
    { text: 'Make a Tic Tac Toe game in html, css and js only' },
  ],
  zh: [
    { text: '使用Tailwind和React构建一个待办事项应用' },
    { text: '使用Astro构建一个简单的博客' },
    { text: '使用Material UI创建一个cookie同意表单' },
    { text: '制作一个太空入侵者游戏' },
    { text: '仅使用HTML、CSS和JS制作一个井字棋游戏' },
  ],
};

interface ExamplePromptsProps {
  sendMessage?: (event: React.UIEvent, messageInput?: string) => void;
}

export function ExamplePrompts({ sendMessage }: ExamplePromptsProps) {
  const { i18n } = useTranslation();
  const language = i18n.language;

  // Use Chinese prompts if language is set to Chinese, otherwise use English
  const promptsToShow = language === 'zh' ? EXAMPLE_PROMPTS.zh : EXAMPLE_PROMPTS.en;

  return (
    <div id="examples" className="relative flex flex-col gap-9 w-full max-w-3xl mx-auto flex justify-center mt-6">
      <div
        className="flex flex-wrap justify-center gap-2"
        style={{
          animation: '.25s ease-out 0s 1 _fade-and-move-in_g2ptj_1 forwards',
        }}
      >
        {promptsToShow.map((examplePrompt, index: number) => {
          return (
            <button
              key={index}
              onClick={(event) => {
                sendMessage?.(event, examplePrompt.text);
              }}
              className="border border-bolt-elements-borderColor rounded-full bg-gray-50 hover:bg-gray-100 dark:bg-gray-950 dark:hover:bg-gray-900 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary px-3 py-1 text-xs transition-theme"
            >
              {examplePrompt.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
