import { fileURLToPath } from 'node:url';
import { build, createServer, preview } from 'vite';
import webConfig from '../apps/web/vite.config.mjs';

const command = process.argv[2] ?? 'dev';
const root = fileURLToPath(new URL('../apps/web', import.meta.url));
const cacheDir = fileURLToPath(new URL('../node_modules/.vite/apps-web', import.meta.url));

const config = {
  ...webConfig,
  root,
  cacheDir,
  configFile: false,
};

if (command === 'build') {
  await build(config);
} else if (command === 'preview') {
  const server = await preview(config);
  server.printUrls();
} else if (command === 'dev') {
  const server = await createServer(config);
  await server.listen();
  server.printUrls();
} else {
  console.error(`Unknown web command: ${command}`);
  process.exit(1);
}
