export type TestCase = {
  type: 'test';
  name: string;
  lineNumber?: number;
  endLineNumber?: number;
};

export type TestSuite = {
  type: 'suite';
  name: string;
  children: (TestCase | TestSuite)[];
  expanded: boolean;
};

export type TestItem = TestCase | TestSuite;

export type TestCodeItem = {
  id: string;
  name: string;
  code: string;
};
