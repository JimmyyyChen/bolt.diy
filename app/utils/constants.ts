import { LLMManager } from '~/lib/modules/llm/manager';
import type { Template } from '~/types/template';

export const WORK_DIR_NAME = 'project';
export const WORK_DIR = `/home/${WORK_DIR_NAME}`;
export const MODIFICATIONS_TAG_NAME = 'bolt_file_modifications';
export const MODEL_REGEX = /^\[Model: (.*?)\]\n\n/;
export const PROVIDER_REGEX = /\[Provider: (.*?)\]\n\n/;
export const DEFAULT_MODEL = 'claude-3-5-sonnet-latest';
export const PROMPT_COOKIE_KEY = 'cachedPrompt';

const llmManager = LLMManager.getInstance(import.meta.env);

export const PROVIDER_LIST = llmManager.getAllProviders();
export const DEFAULT_PROVIDER = llmManager.getDefaultProvider();

export const providerBaseUrlEnvKeys: Record<string, { baseUrlKey?: string; apiTokenKey?: string }> = {};
PROVIDER_LIST.forEach((provider) => {
  providerBaseUrlEnvKeys[provider.name] = {
    baseUrlKey: provider.config.baseUrlKey,
    apiTokenKey: provider.config.apiTokenKey,
  };
});

// starter Templates

export const STARTER_TEMPLATES: Template[] = [
  {
    name: 'bolt-astro-basic',
    label: 'Astro Basic',
    description: 'Lightweight Astro starter template for building fast static websites',
    githubRepo: 'thecodacus/bolt-astro-basic-template',
    tags: ['astro', 'blog', 'performance'],
    icon: 'i-bolt:astro',
  },
  {
    name: 'bolt-nextjs-shadcn',
    label: 'Next.js with shadcn/ui',
    description: 'Next.js starter fullstack template integrated with shadcn/ui components and styling system',
    githubRepo: 'thecodacus/bolt-nextjs-shadcn-template',
    tags: ['nextjs', 'react', 'typescript', 'shadcn', 'tailwind'],
    icon: 'i-bolt:nextjs',
  },
  {
    name: 'bolt-qwik-ts',
    label: 'Qwik TypeScript',
    description: 'Qwik framework starter with TypeScript for building resumable applications',
    githubRepo: 'thecodacus/bolt-qwik-ts-template',
    tags: ['qwik', 'typescript', 'performance', 'resumable'],
    icon: 'i-bolt:qwik',
  },
  {
    name: 'bolt-remix-ts',
    label: 'Remix TypeScript',
    description: 'Remix framework starter with TypeScript for full-stack web applications',
    githubRepo: 'thecodacus/bolt-remix-ts-template',
    tags: ['remix', 'typescript', 'fullstack', 'react'],
    icon: 'i-bolt:remix',
  },
  {
    name: 'bolt-slidev',
    label: 'Slidev Presentation',
    description: 'Slidev starter template for creating developer-friendly presentations using Markdown',
    githubRepo: 'thecodacus/bolt-slidev-template',
    tags: ['slidev', 'presentation', 'markdown'],
    icon: 'i-bolt:slidev',
  },
  {
    name: 'bolt-sveltekit',
    label: 'SvelteKit',
    description: 'SvelteKit starter template for building fast, efficient web applications',
    githubRepo: 'bolt-sveltekit-template',
    tags: ['svelte', 'sveltekit', 'typescript'],
    icon: 'i-bolt:svelte',
  },
  {
    name: 'vanilla-vite',
    label: 'Vanilla + Vite',
    description: 'Minimal Vite starter template for vanilla JavaScript projects',
    githubRepo: 'thecodacus/vanilla-vite-template',
    tags: ['vite', 'vanilla-js', 'minimal'],
    icon: 'i-bolt:vite',
  },
  {
    name: 'bolt-vite-react',
    label: 'React + Vite + typescript',
    description: 'React starter template powered by Vite for fast development experience',
    githubRepo: 'thecodacus/bolt-vite-react-ts-template',
    tags: ['react', 'vite', 'frontend'],
    icon: 'i-bolt:react',
  },
  {
    name: 'bolt-vite-ts',
    label: 'Vite + TypeScript',
    description: 'Vite starter template with TypeScript configuration for type-safe development',
    githubRepo: 'thecodacus/bolt-vite-ts-template',
    tags: ['vite', 'typescript', 'minimal'],
    icon: 'i-bolt:typescript',
  },
  {
    name: 'bolt-vue',
    label: 'Vue.js',
    description: 'Vue.js starter template with modern tooling and best practices',
    githubRepo: 'thecodacus/bolt-vue-template',
    tags: ['vue', 'typescript', 'frontend'],
    icon: 'i-bolt:vue',
  },
  {
    name: 'bolt-angular',
    label: 'Angular Starter',
    description: 'A modern Angular starter template with TypeScript support and best practices configuration',
    githubRepo: 'thecodacus/bolt-angular-template',
    tags: ['angular', 'typescript', 'frontend', 'spa'],
    icon: 'i-bolt:angular',
  },
];

export const INITIAL_TEST_CODE = `
describe("Calculator Functions", () => {
  describe("Addition and Subtraction", () => {
    describe("Addition", () => {
      test("adds two positive numbers", () => {
        expect(add(2, 3)).toBe(5);
      });

      test("adds a positive and a negative number", () => {
        expect(add(5, -2)).toBe(3);
      });

      test("adds two negative numbers", () => {
        expect(add(-4, -6)).toBe(-10);
      });
    });

    describe("Subtraction", () => {
      test("subtracts two positive numbers", () => {
        expect(subtract(10, 4)).toBe(6);
      });

      test("subtracts a larger number from a smaller number", () => {
        expect(subtract(3, 7)).toBe(-4);
      });

      test("subtracts negative numbers", () => {
        expect(subtract(-5, -2)).toBe(-3);
      });
    });
  });

  describe("Multiplication and Division", () => {
    describe("Multiplication", () => {
      test("multiplies two positive numbers", () => {
        expect(multiply(3, 4)).toBe(12);
      });

      test("multiplies a positive and a negative number", () => {
        expect(multiply(-2, 6)).toBe(-12);
      });

      test("multiplies by zero", () => {
        expect(multiply(10, 0)).toBe(0);
      });
    });

    describe("Division", () => {
      test("divides two positive numbers", () => {
        expect(divide(10, 2)).toBe(5);
      });

      test("divides a negative number by a positive number", () => {
        expect(divide(-9, 3)).toBe(-3);
      });

      test("throws error when dividing by zero", () => {
        expect(() => divide(5, 0)).toThrow("Cannot divide by zero");
      });
    });
  });
});
`;
