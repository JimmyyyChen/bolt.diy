import { AnimatePresence, motion } from 'framer-motion';
import { memo, useState } from 'react';
import { classNames } from '~/utils/classNames';
import { cubicEasingFn } from '~/utils/easings';
import { TestTube, ChevronUp, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface TestAction {
  name: string;
  filePath: string;
  content: string;
  summary?: string;
}

export interface TestActionsType {
  actions: TestAction[];
}

interface TestActionsAnnotationProps {
  testActions: TestActionsType;
}

export const TestActionsAnnotation = memo(({ testActions }: TestActionsAnnotationProps) => {
  const [showDetails, setShowDetails] = useState(false);
  const { t } = useTranslation();

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  const { actions } = testActions;

  if (!actions || actions.length === 0) {
    return null;
  }

  return (
    <div className="border border-bolt-elements-borderColor flex flex-col overflow-hidden rounded-lg w-full transition-border duration-150 mt-4">
      <div className="flex">
        <button
          className="flex items-stretch bg-bolt-elements-artifacts-background hover:bg-bolt-elements-artifacts-backgroundHover w-full overflow-hidden"
          onClick={toggleDetails}
        >
          <div className="p-4">
            <TestTube size={32} />
          </div>
          <div className="bg-bolt-elements-artifacts-borderColor w-[1px]" />
          <div className="px-5 p-3.5 w-full text-left">
            <div className="w-full text-bolt-elements-textPrimary font-medium leading-5 text-sm">
              {t('testActions.title')}
            </div>
            <div className="w-full text-bolt-elements-textSecondary text-xs mt-0.5">
              {actions.length} {t(actions.length > 1 ? 'testActions.testsPlural' : 'testActions.testsSingular')}{' '}
              {t('testActions.available')}
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
              <TestsList actions={actions} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

const testVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

interface TestsListProps {
  actions: TestActionsType['actions'];
}

const TestsList = memo(({ actions }: TestsListProps) => {
  const { t } = useTranslation();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
      <ul className="list-none space-y-4">
        {actions.map((action, index) => {
          const isLast = index === actions.length - 1;

          return (
            <motion.li
              key={index}
              variants={testVariants}
              initial="hidden"
              animate="visible"
              transition={{
                duration: 0.2,
                ease: cubicEasingFn,
                delay: index * 0.05,
              }}
            >
              <div className="flex items-center gap-2 text-sm mb-2">
                <div className="px-2 py-0.5 rounded text-white font-mono text-xs bg-purple-600">
                  {t('testActions.test')}
                </div>
                <div className="font-semibold">{action.name}</div>
              </div>

              <div className="ml-6 mb-2">
                <div className="text-bolt-elements-textSecondary text-xs mb-1">{t('testActions.filePath')}:</div>
                <div className="bg-bolt-elements-artifacts-inlineCode-background text-bolt-elements-artifacts-inlineCode-text px-3 py-2 rounded-md font-mono">
                  {action.filePath}
                </div>

                {action.summary && (
                  <>
                    <div className="text-bolt-elements-textSecondary text-xs mt-3 mb-1">
                      {t('testActions.description')}:
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
    </motion.div>
  );
});
