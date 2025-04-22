import { RemixBrowser } from '@remix-run/react';
import { startTransition } from 'react';
import { hydrateRoot } from 'react-dom/client';
import './i18n'; // Import and initialize i18n

startTransition(() => {
  hydrateRoot(document.getElementById('root')!, <RemixBrowser />);
});
