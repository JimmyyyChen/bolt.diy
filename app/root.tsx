import { useStore } from '@nanostores/react';
import type { LinksFunction, LoaderFunctionArgs } from '@remix-run/cloudflare';
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from '@remix-run/react';
import tailwindReset from '@unocss/reset/tailwind-compat.css?url';
import { themeStore } from './lib/stores/theme';
import { createHead } from 'remix-island';
import { useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ClientOnly } from 'remix-utils/client-only';
import i18n, { changeLanguage } from './i18n';

import reactToastifyStyles from 'react-toastify/dist/ReactToastify.css?url';
import globalStyles from './styles/index.scss?url';
import xtermStyles from '@xterm/xterm/css/xterm.css?url';

import 'virtual:uno.css';

export const links: LinksFunction = () => [
  {
    rel: 'icon',
    href: '/favicon.svg',
    type: 'image/svg+xml',
  },
  { rel: 'stylesheet', href: reactToastifyStyles },
  { rel: 'stylesheet', href: tailwindReset },
  { rel: 'stylesheet', href: globalStyles },
  { rel: 'stylesheet', href: xtermStyles },
  {
    rel: 'preconnect',
    href: 'https://fonts.googleapis.com',
  },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  },
];

/*
 * const inlineThemeCode = stripIndents`
 *   setTutorialKitTheme();
 */

/*
 *   function setTutorialKitTheme() {
 *     let theme = localStorage.getItem('bolt_theme');
 */

/*
 *     if (!theme) {
 *       theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
 *     }
 */

/*
 *     document.querySelector('html')?.setAttribute('data-theme', theme);
 *   }
 * `;
 */

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const isChinese = url.pathname.startsWith('/cn');

  // Set initial language based on URL path
  if (isChinese) {
    i18n.changeLanguage('zh');
  }

  return new Response(JSON.stringify({ language: isChinese ? 'zh' : 'en' }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const Head = createHead(() => (
  <>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <Meta />
    <Links />
    {/* TODO: disable theme script for now */}
    {/* <script dangerouslySetInnerHTML={{ __html: inlineThemeCode }} /> */}
  </>
));

export function Layout({ children, language }: { children: React.ReactNode; language?: string }) {
  const theme = useStore(themeStore);

  useEffect(() => {
    document.querySelector('html')?.setAttribute('data-theme', theme);

    // If language is provided from loader, update it
    if (language) {
      changeLanguage(language);
    }
  }, [theme, language]);

  return (
    <>
      <ClientOnly>{() => <DndProvider backend={HTML5Backend}>{children}</DndProvider>}</ClientOnly>
      <ScrollRestoration />
      <Scripts />
    </>
  );
}

import { logStore } from './lib/stores/logs';

export default function App() {
  const theme = useStore(themeStore);
  const { language } = useLoaderData<{ language: string }>();

  useEffect(() => {
    logStore.logSystem('Application initialized', {
      theme,
      language,
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    });
  }, []);

  return (
    <Layout language={language}>
      <Outlet />
    </Layout>
  );
}
