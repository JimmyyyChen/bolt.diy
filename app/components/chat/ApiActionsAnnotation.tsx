import { AnimatePresence, motion } from 'framer-motion';
import { memo, useState } from 'react';
import type { ApiActionsAnnotation as ApiActionsType } from '~/types/context';
import { classNames } from '~/utils/classNames';
import { cubicEasingFn } from '~/utils/easings';
import { Plug, ChevronUp, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ApiActionsAnnotationProps {
  apiActions: ApiActionsType;
}

export const ApiActionsAnnotation = memo(({ apiActions }: ApiActionsAnnotationProps) => {
  const [showDetails, setShowDetails] = useState(false);
  const { t } = useTranslation();

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  const { actions } = apiActions;

  if (!actions || actions.length === 0) {
    return null;
  }

  // Count unique servers
  const uniqueServers = new Set(actions.map((action) => action.serverUrl || t('apiActions.unknownServer'))).size;

  return (
    <div className="border border-bolt-elements-borderColor flex flex-col overflow-hidden rounded-lg w-full transition-border duration-150 mt-4">
      <div className="flex">
        <button
          className="flex items-stretch bg-bolt-elements-artifacts-background hover:bg-bolt-elements-artifacts-backgroundHover w-full overflow-hidden"
          onClick={toggleDetails}
        >
          <div className="p-4">
            <Plug size={32} />
          </div>
          <div className="bg-bolt-elements-artifacts-borderColor w-[1px]" />
          <div className="px-5 p-3.5 w-full text-left">
            <div className="w-full text-bolt-elements-textPrimary font-medium leading-5 text-sm">
              {t('apiActions.title')}
            </div>
            <div className="w-full text-bolt-elements-textSecondary text-xs mt-0.5">
              {actions.length} {t(actions.length > 1 ? 'apiActions.actionsPlural' : 'apiActions.actionsSingular')}{' '}
              {t('apiActions.availableFrom')} {uniqueServers}
              {uniqueServers > 1 ? t('apiActions.apisPlural') : t('apiActions.apisSingular')}
            </div>
          </div>
        </button>
        <div className="bg-bolt-elements-artifacts-borderColor w-[1px]" />
        <AnimatePresence>
          <motion.button
            initial={{ width: 0 }}
            animate={{ width: 'auto' }}
            exit={{ width: 0 }}
            transition={{ duration: 0.15, ease: cubicEasingFn }}
            className="bg-bolt-elements-artifacts-background hover:bg-bolt-elements-artifacts-backgroundHover"
            onClick={toggleDetails}
          >
            <div className="p-4">{showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</div>
          </motion.button>
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {showDetails && (
          <motion.div
            className="details"
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: '0px' }}
            transition={{ duration: 0.15 }}
          >
            <div className="bg-bolt-elements-artifacts-borderColor h-[1px]" />

            <div className="p-5 text-left bg-bolt-elements-actions-background">
              <ActionsList actions={actions} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

const actionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

interface ActionsListProps {
  actions: ApiActionsType['actions'];
}

const ActionsList = memo(({ actions }: ActionsListProps) => {
  const { t } = useTranslation();

  // Group actions by server URL
  const actionsByServer = actions.reduce(
    (acc, action) => {
      const serverUrl = action.serverUrl || t('apiActions.unknownServer');

      if (!acc[serverUrl]) {
        acc[serverUrl] = [];
      }

      acc[serverUrl].push(action);

      return acc;
    },
    {} as Record<string, typeof actions>,
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
      {Object.entries(actionsByServer).map(([serverUrl, serverActions], serverIndex) => (
        <div key={serverUrl} className={serverIndex > 0 ? 'mt-6 pt-6 border-t border-bolt-elements-borderColor' : ''}>
          <div className="text-bolt-elements-textSecondary text-sm mb-3">
            <span className="font-semibold">{t('apiActions.serverUrl')}:</span>{' '}
            {serverUrl === t('apiActions.unknownServer') ? t('apiActions.notSpecified') : serverUrl}
          </div>
          <ul className="list-none space-y-4">
            {serverActions.map((action, index) => {
              const isLast = index === serverActions.length - 1;
              const methodColor = getMethodColor(action.method);

              return (
                <motion.li
                  key={index}
                  variants={actionVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{
                    duration: 0.2,
                    ease: cubicEasingFn,
                    delay: index * 0.05,
                  }}
                >
                  <div className="flex items-center gap-2 text-sm mb-2">
                    <div className={classNames('px-2 py-0.5 rounded text-white font-mono text-xs', methodColor)}>
                      {action.method}
                    </div>
                    <div className="font-semibold">{action.name}</div>
                  </div>

                  <div className="ml-6 mb-2">
                    <div className="text-bolt-elements-textSecondary text-xs mb-1">{t('apiActions.path')}:</div>
                    <div className="bg-bolt-elements-artifacts-inlineCode-background text-bolt-elements-artifacts-inlineCode-text px-3 py-2 rounded-md font-mono">
                      {action.path}
                    </div>

                    {action.summary && (
                      <>
                        <div className="text-bolt-elements-textSecondary text-xs mt-3 mb-1">
                          {t('apiActions.description')}:
                        </div>
                        <div
                          className={classNames('px-3 py-2 rounded-md text-sm', {
                            'mb-3.5': !isLast,
                          })}
                        >
                          {action.summary}
                        </div>
                      </>
                    )}
                  </div>
                </motion.li>
              );
            })}
          </ul>
        </div>
      ))}
    </motion.div>
  );
});

// Helper function to get method color based on HTTP method
function getMethodColor(method: string): string {
  const normalizedMethod = method.toUpperCase();

  switch (normalizedMethod) {
    case 'GET':
      return 'bg-green-600';
    case 'POST':
      return 'bg-blue-600';
    case 'PUT':
      return 'bg-amber-600';
    case 'PATCH':
      return 'bg-orange-600';
    case 'DELETE':
      return 'bg-red-600';
    default:
      return 'bg-gray-600';
  }
}
