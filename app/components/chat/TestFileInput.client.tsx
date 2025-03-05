import Editor from 'react-simple-code-editor';
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/Card';
import { ChevronDown, ChevronRight, Copy, Clipboard } from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism.css';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

type TestCase = {
  type: 'test';
  name: string;
  lineNumber?: number;
  endLineNumber?: number;
};

type TestSuite = {
  type: 'suite';
  name: string;
  children: (TestCase | TestSuite)[];
  expanded: boolean;
};

type TestItem = TestCase | TestSuite;

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

// Updated parser to handle both 'it' and 'test' methods
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
    } // Skip empty lines

    const describeMatch = line.match(/describe\(['"](.+)['"]/);

    // Updated regex to match both 'it' and 'test' methods
    const testMatch = line.match(/(?:it|test)\(['"](.+)['"]/);

    // Pop stack items with greater or equal indentation
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
    className={`py-1 pl-5 hover:bg-muted/50 rounded cursor-pointer text-sm
      ${isSelected ? 'bg-muted/70 font-medium' : ''}`}
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
      className="flex items-center gap-1.5 py-1 hover:bg-muted/50 rounded cursor-pointer"
      onClick={() => onToggle(suite)}
    >
      {suite.expanded ? (
        <ChevronDown className="w-3.5 h-3.5 chevron-icon" />
      ) : (
        <ChevronRight className="w-3.5 h-3.5 chevron-icon" />
      )}
      <span className="font-medium text-sm">{suite.name}</span>
    </div>

    {suite.expanded && suite.children && (
      <div className="ml-3 border-l border-gray-200 pl-2 mt-1">
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
}) => {
  return (
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
};

export default function TestFileInputClient({
  setTestCode,
  testCode,
}: {
  setTestCode: (code: string) => void;
  testCode: string;
}) {
  const [testStructure, setTestStructure] = useState<TestItem[]>([]);
  const [selectedTest, setSelectedTest] = useState<TestCase | undefined>();
  const editorRef = useRef<HTMLDivElement>(null);
  const [copyStatus, setCopyStatus] = useState<'copy' | 'copied'>('copy');
  const [pasteStatus, setPasteStatus] = useState<'paste' | 'pasted'>('paste');

  const highlightCode = (code: string) => {
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
        return `<span class="highlight-line">${Prism.highlight(line, Prism.languages.javascript, 'javascript')}</span>`;
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

    // Clear the selection after animation
    setTimeout(() => {
      setSelectedTest(undefined);
    }, 2000); // Match the animation duration
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(testCode);
    setCopyStatus('copied');

    // Reset status after 2 seconds
    setTimeout(() => {
      setCopyStatus('copy');
    }, 2000);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      handleCodeChange(text);
      setPasteStatus('pasted');

      // Reset status after 2 seconds
      setTimeout(() => {
        setPasteStatus('paste');
      }, 2000);
    } catch (err) {
      console.error('Failed to read clipboard contents: ', err);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes highlightFade {
              0% {
                background-color: rgba(62, 184, 255, 0.2);
              }
              100% {
                background-color: rgba(62, 184, 255, 0);
              }
            }
            .highlight-line {
              animation: highlightFade 2s ease-out forwards;
              display: inline-block;
              width: 100%;
            }
            .panel-resize-handle {
              width: 4px;
              background-color: #e5e7eb;
              margin: 0 -2px;
              transition: background-color 0.2s;
              cursor: col-resize;
            }
            .panel-resize-handle:hover, 
            .panel-resize-handle[data-resize-handle-active="true"] {
              background-color: #94a3b8;
            }
            .panel-content {
              display: flex;
              flex-direction: column;
              height: 450px;
              border-radius: 0.375rem;
              border: 1px solid #e5e7eb;
              overflow: hidden;
            }
            .test-structure-panel {
              flex: 1;
              overflow: auto;
              scrollbar-width: none; /* Firefox */
              -ms-overflow-style: none; /* IE and Edge */
              padding: 1rem;
            }
            .test-structure-panel::-webkit-scrollbar {
              display: none; /* Chrome, Safari, Opera */
            }
            .editor-container {
              display: flex;
              flex-direction: column;
              height: 100%;
            }
            .editor-content {
              flex: 1;
              overflow: auto;
            }
            .chevron-icon {
              flex-shrink: 0;
              min-width: 14px;
            }
            .editor-toolbar {
              display: flex;
              padding: 6px 10px;
              background-color: #f9fafb;
              border-bottom: 1px solid #e5e7eb;
              align-items: center;
            }
            .editor-toolbar button {
              display: flex;
              align-items: center;
              justify-content: center;
              width: 28px;
              height: 28px;
              border-radius: 4px;
              margin-right: 4px;
              background: transparent;
              border: none;
              cursor: pointer;
              color: #6b7280;
              transition: all 0.2s;
            }
            .editor-toolbar button:hover {
              background-color: #e5e7eb;
              color: #374151;
            }
            .editor-toolbar button:disabled {
              opacity: 0.5;
              cursor: not-allowed;
            }
            .editor-toolbar button:disabled:hover {
              background-color: transparent;
            }
            .button-with-status {
              display: flex;
              align-items: center;
              position: relative;
            }
            .status-text {
              font-size: 12px;
              margin-left: 4px;
              color: #6b7280;
              transition: color 0.2s;
            }
            .status-success {
              color: #10b981;
            }
          `,
        }}
      />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xl">Jest Test</CardTitle>
        </CardHeader>
        <CardContent>
          <PanelGroup direction="horizontal">
            <Panel defaultSize={30} minSize={20}>
              <div className="panel-content">
                <div className="test-structure-panel">
                  <TestStructure
                    items={testStructure}
                    onToggle={handleToggle}
                    onTestClick={handleTestClick}
                    selectedTest={selectedTest}
                  />
                </div>
              </div>
            </Panel>

            <PanelResizeHandle className="panel-resize-handle" />

            <Panel defaultSize={70} minSize={30}>
              <div className="panel-content">
                <div className="editor-container">
                  <div className="editor-toolbar">
                    <div className="button-with-status">
                      <button onClick={handleCopy} title="Copy">
                        <Copy size={16} />
                      </button>
                      <span className={`status-text ${copyStatus === 'copied' ? 'status-success' : ''}`}>
                        {copyStatus}
                      </span>
                    </div>
                    <div className="button-with-status ml-2">
                      <button onClick={handlePaste} title="Paste">
                        <Clipboard size={16} />
                      </button>
                      <span className={`status-text ${pasteStatus === 'pasted' ? 'status-success' : ''}`}>
                        {pasteStatus}
                      </span>
                    </div>
                  </div>
                  <div ref={editorRef} className="editor-content">
                    <Editor
                      value={testCode}
                      onValueChange={handleCodeChange}
                      highlight={highlightCode}
                      padding={10}
                      style={{
                        fontFamily: '"Fira code", "Fira Mono", monospace',
                        fontSize: 12,
                        minHeight: '100%',
                      }}
                      textareaClassName="outline-none"
                      className="min-h-full [&_textarea]:outline-none"
                    />
                  </div>
                </div>
              </div>
            </Panel>
          </PanelGroup>
        </CardContent>
      </Card>
    </div>
  );
}
