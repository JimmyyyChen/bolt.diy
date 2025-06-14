import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogRoot } from '~/components/ui/Dialog';
import { Button } from '~/components/ui/Button';
import { useStore } from '@nanostores/react';
import { chatStore } from '~/lib/stores/chat';
import { ChevronDown, ChevronRight, Code } from 'lucide-react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism.css';
import { classNames } from '~/utils/classNames';
import { INITIAL_TEST_CODE } from '~/utils/constants';
import type { TestCase, TestSuite, TestItem, TestCodeItem } from '~/types/test';
import { useTranslation } from 'react-i18next';

// Helper functions for parsing test files
const findTestPositions = (code: string): Map<string, { start: number; end: number }> => {
  const lines = code.split('\n');
  const positions = new Map<string, { start: number; end: number }>();
  let currentTest: { name: string; start: number } | null = null;
  let bracketCount = 0;

  lines.forEach((line, index) => {
    const testMatch = line.match(/(?:it|test)\(['"](.+)['"]/);

    if (testMatch) {
      currentTest = { name: testMatch[1], start: index };
      bracketCount = 0;
    }

    if (currentTest) {
      bracketCount += (line.match(/\{/g) || []).length;
      bracketCount -= (line.match(/\}/g) || []).length;

      if (bracketCount === 0 && line.includes('}')) {
        positions.set(currentTest.name, { start: currentTest.start, end: index });
        currentTest = null;
      }
    }
  });

  return positions;
};

const parseTestFile = (code: string): TestItem[] => {
  const lines = code.split('\n');
  const rootSuite: TestSuite = {
    type: 'suite',
    name: 'root',
    children: [],
    expanded: true,
  };

  const stack: { suite: TestSuite; indent: number }[] = [{ suite: rootSuite, indent: -1 }];
  const testPositions = findTestPositions(code);

  lines.forEach((line) => {
    const indentation = line.search(/\S/);

    if (indentation === -1) {
      return;
    }

    const describeMatch = line.match(/describe\(['"](.+)['"]/);
    const testMatch = line.match(/(?:it|test)\(['"](.+)['"]/);

    while (stack.length > 1 && stack[stack.length - 1].indent >= indentation) {
      stack.pop();
    }

    const currentSuite = stack[stack.length - 1].suite;

    if (describeMatch) {
      const newSuite: TestSuite = {
        type: 'suite',
        name: describeMatch[1],
        children: [],
        expanded: true,
      };
      currentSuite.children.push(newSuite);
      stack.push({ suite: newSuite, indent: indentation });
    } else if (testMatch) {
      const testName = testMatch[1];
      const position = testPositions.get(testName);
      const test: TestCase = {
        type: 'test',
        name: testName,
        lineNumber: position?.start,
        endLineNumber: position?.end,
      };
      currentSuite.children.push(test);
    }
  });

  return rootSuite.children;
};

// Test structure components
const TestCaseItem = ({
  test,
  onClick,
  isSelected,
}: {
  test: TestCase;
  onClick: (test: TestCase) => void;
  isSelected: boolean;
}) => (
  <div
    className={classNames(
      'py-1 pl-5 cursor-pointer text-sm text-bolt-elements-textSecondary',
      'hover:bg-bolt-elements-background-depth-3',
      isSelected ? 'bg-bolt-elements-background-depth-3 font-medium text-bolt-elements-textPrimary' : '',
    )}
    onClick={() => onClick(test)}
  >
    {test.name}
  </div>
);

const TestSuiteItem = ({
  suite,
  onToggle,
  onTestClick,
  selectedTest,
}: {
  suite: TestSuite;
  onToggle: (suite: TestSuite) => void;
  onTestClick: (test: TestCase) => void;
  selectedTest?: TestCase;
}) => (
  <div>
    <div
      className="flex items-center gap-1.5 py-1 hover:bg-bolt-elements-background-depth-3 cursor-pointer text-bolt-elements-textPrimary"
      onClick={() => onToggle(suite)}
    >
      {suite.expanded ? (
        <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" />
      ) : (
        <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
      )}
      <span className="font-medium text-sm">{suite.name}</span>
    </div>

    {suite.expanded && suite.children && (
      <div className="ml-3 border-l border-bolt-elements-borderColor pl-2 mt-1">
        <TestStructure
          items={suite.children}
          onToggle={onToggle}
          onTestClick={onTestClick}
          selectedTest={selectedTest}
        />
      </div>
    )}
  </div>
);

const TestStructure = ({
  items,
  onToggle,
  onTestClick,
  selectedTest,
}: {
  items: TestItem[];
  onToggle: (suite: TestSuite) => void;
  onTestClick: (test: TestCase) => void;
  selectedTest?: TestCase;
}) => (
  <div className="space-y-1">
    {items.map((item, index) => (
      <div key={index}>
        {item.type === 'suite' ? (
          <TestSuiteItem suite={item} onToggle={onToggle} onTestClick={onTestClick} selectedTest={selectedTest} />
        ) : (
          <TestCaseItem test={item} onClick={onTestClick} isSelected={selectedTest === item} />
        )}
      </div>
    ))}
  </div>
);

// The TestEditor component
function TestEditor({
  testCode,
  setTestCode,
  currentName,
  setCurrentName,
}: {
  testCode: string;
  setTestCode: (code: string) => void;
  currentName: string;
  setCurrentName: (name: string) => void;
}) {
  const { t } = useTranslation();
  const [testStructure, setTestStructure] = useState<TestItem[]>([]);
  const [selectedTest, setSelectedTest] = useState<TestCase | undefined>();
  const editorRef = useRef<HTMLDivElement>(null);

  const highlightCode = (code: string) => {
    if (!code.trim()) {
      return `<span class="text-bolt-elements-textTertiary">${t('testContext.pasteTestFile')}</span>`;
    }

    if (!selectedTest?.lineNumber || !selectedTest?.endLineNumber) {
      return Prism.highlight(code, Prism.languages.javascript, 'javascript');
    }

    const lines = code.split('\n');
    const highlightedLines = lines.map((line, index) => {
      if (
        selectedTest.lineNumber !== undefined &&
        selectedTest.endLineNumber !== undefined &&
        index >= selectedTest.lineNumber &&
        index <= selectedTest.endLineNumber
      ) {
        return `<span class="bg-bolt-elements-focus-alpha10">${Prism.highlight(line, Prism.languages.javascript, 'javascript')}</span>`;
      }

      return Prism.highlight(line, Prism.languages.javascript, 'javascript');
    });

    return highlightedLines.join('\n');
  };

  useEffect(() => {
    const structure = parseTestFile(testCode);
    setTestStructure(structure);
  }, [testCode]);

  const handleCodeChange = (code: string) => {
    setTestCode(code);
  };

  const handleToggle = (suite: TestSuite) => {
    const toggleExpansion = (items: TestItem[]): TestItem[] => {
      return items.map((item) => {
        if (item === suite) {
          return { ...item, expanded: !item.expanded };
        }

        if (item.type === 'suite') {
          return { ...item, children: toggleExpansion(item.children) };
        }

        return item;
      });
    };

    setTestStructure(toggleExpansion(testStructure));
  };

  const handleTestClick = (test: TestCase) => {
    setSelectedTest(test);

    setTimeout(() => {
      if (editorRef.current && test.lineNumber !== undefined) {
        const lineHeight = 20;
        const scrollTop = test.lineNumber * lineHeight;
        editorRef.current.scrollTop = scrollTop - 100;
      }
    }, 0);

    // Clear the selection after a delay
    setTimeout(() => {
      setSelectedTest(undefined);
    }, 2000);
  };

  const loadExampleCode = () => {
    setTestCode(INITIAL_TEST_CODE.trim());

    // Extract a default name from the test structure
    const match = INITIAL_TEST_CODE.match(/describe\(['"](.+)['"]/);

    if (match && match[1]) {
      setCurrentName(match[1]);
    } else {
      setCurrentName('Calculator Tests');
    }
  };

  return (
    <div>
      <div className="flex justify-between mb-4 items-center">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">{t('testContext.jestTest')}</h2>
          <input
            type="text"
            value={currentName}
            onChange={(e) => setCurrentName(e.target.value)}
            placeholder={t('testContext.testName')}
            className="px-2 py-1 text-sm border rounded-md"
          />
        </div>
        <Button variant="ghost" size="sm" className="text-xs flex items-center gap-1" onClick={loadExampleCode}>
          <Code size={14} />
          <span>{t('common.example')}</span>
        </Button>
      </div>
      <div className="flex h-[450px] border overflow-hidden">
        <div className="w-1/3 border-r overflow-auto p-4">
          <TestStructure
            items={testStructure}
            onToggle={handleToggle}
            onTestClick={handleTestClick}
            selectedTest={selectedTest}
          />
        </div>
        <div className="w-2/3">
          <div ref={editorRef} className="h-full overflow-auto">
            <Editor
              value={testCode}
              onValueChange={handleCodeChange}
              highlight={highlightCode}
              padding={10}
              className="min-h-full outline-none font-mono text-xs"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Main AddTestModal component
export function AddTestModal({ isOpen, onClose, testId }: { isOpen: boolean; onClose: () => void; testId?: string }) {
  const { t } = useTranslation();
  const { testCodes = [] } = useStore(chatStore);
  const [currentTestCode, setCurrentTestCode] = useState('');
  const [currentTestName, setCurrentTestName] = useState('');
  const [currentTestId, setCurrentTestId] = useState<string | null>(null);

  // Load existing test when testId changes
  useEffect(() => {
    if (isOpen && testId) {
      const existingTest = testCodes.find((test: TestCodeItem) => test.id === testId);

      if (existingTest) {
        setCurrentTestCode(existingTest.code);
        setCurrentTestName(existingTest.name);
        setCurrentTestId(existingTest.id);
      }
    } else if (isOpen) {
      // Reset when opening for a new test
      setCurrentTestCode('');
      setCurrentTestName('');
      setCurrentTestId(null);
    }
  }, [isOpen, testId, testCodes]);

  // Generate a unique ID for the test code
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  const handleSaveTestCode = () => {
    let finalName = currentTestName.trim();

    if (!finalName) {
      // If no name is provided, extract it from the test code
      const match = currentTestCode.match(/describe\(['"](.+)['"]/);

      if (match && match[1]) {
        finalName = match[1];
      } else {
        finalName = `Test ${testCodes.length + 1}`;
      }
    }

    let updatedTestCodes;

    if (currentTestId) {
      // Update existing test
      updatedTestCodes = testCodes.map((test: TestCodeItem) =>
        test.id === currentTestId ? { ...test, name: finalName, code: currentTestCode } : test,
      );
    } else {
      // Add new test
      const newTest: TestCodeItem = {
        id: generateId(),
        name: finalName,
        code: currentTestCode,
      };
      updatedTestCodes = [...testCodes, newTest];
    }

    chatStore.setKey('testCodes', updatedTestCodes);
    onClose();
  };

  return (
    <DialogRoot open={isOpen}>
      <Dialog className="w-[95vw] max-w-6xl rounded-xl bg-bolt-elements-background-depth-1" onClose={onClose}>
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          <TestEditor
            testCode={currentTestCode}
            setTestCode={setCurrentTestCode}
            currentName={currentTestName}
            setCurrentName={setCurrentTestName}
          />
        </div>
        <div className="flex justify-end p-4 border-t gap-3">
          <Button variant="secondary" className="rounded-full" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button className="rounded-full" onClick={handleSaveTestCode}>
            {t('common.save')}
          </Button>
        </div>
      </Dialog>
    </DialogRoot>
  );
}
