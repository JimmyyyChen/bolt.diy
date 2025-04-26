import type { LoaderFunctionArgs } from '@remix-run/cloudflare';
import { default as IndexRoute } from './_index';

/**
 * This route handles Chinese language chat paths: /cn/chat/$id
 * It works just like the regular chat.$id route but preserves the /cn prefix
 */
export const loader = async ({ params }: LoaderFunctionArgs) => {
  return new Response(JSON.stringify({ id: params.id }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

// Use the same component as the main index route
export default IndexRoute;
