import type { LoaderFunctionArgs } from '@remix-run/cloudflare';

/**
 * This is a special Remix route that handles all requests to /cn/*
 * It extracts the actual path after /cn and forwards to the corresponding
 * route while setting the language to Chinese
 */
export const loader = async ({}: LoaderFunctionArgs) => {
  // The root loader will handle the language setting based on the URL path
  return new Response(null);
};

// For /cn or /cn/ paths, render the index component directly
export { default } from './_index';
