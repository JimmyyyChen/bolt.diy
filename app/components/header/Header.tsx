import { useStore } from '@nanostores/react';
import { ClientOnly } from 'remix-utils/client-only';
import { chatStore } from '~/lib/stores/chat';
import { classNames } from '~/utils/classNames';
import { HeaderActionButtons } from './HeaderActionButtons.client';
import { ChatDescription } from '~/lib/persistence/ChatDescription.client';
import { menuStore, menuToggleButtonRef, toggleMenu } from '~/lib/stores/menu';
import { useRef, useEffect } from 'react';

export function Header() {
  const chat = useStore(chatStore);
  const isMenuOpen = useStore(menuStore);
  const menuButtonRef = useRef<HTMLDivElement>(null);

  // Store the menu button reference in the store
  useEffect(() => {
    if (menuButtonRef.current) {
      menuToggleButtonRef.set(menuButtonRef.current);
    }

    return () => {
      menuToggleButtonRef.set(null);
    };
  }, []);

  return (
    <header
      className={classNames('flex items-center p-5 border-b h-[var(--header-height)]', {
        'border-transparent': !chat.started,
        'border-bolt-elements-borderColor': chat.started,
      })}
    >
      <div className="flex items-center gap-2 z-logo text-bolt-elements-textPrimary cursor-pointer">
        <div
          ref={menuButtonRef}
          className={classNames('i-ph:sidebar-simple-duotone text-xl', {
            'text-purple-600': isMenuOpen,
          })}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleMenu();
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          role="button"
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
        />
        <a href="/" className="text-2xl font-semibold text-accent flex items-center">
          bolt.SE
        </a>
      </div>
      {chat.started && (
        <>
          <span className="flex-1 px-4 truncate text-center text-bolt-elements-textPrimary">
            <ClientOnly>{() => <ChatDescription />}</ClientOnly>
          </span>
          <ClientOnly>
            {() => (
              <div className="mr-1">
                <HeaderActionButtons />
              </div>
            )}
          </ClientOnly>
        </>
      )}
    </header>
  );
}
