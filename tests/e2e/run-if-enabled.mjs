import { spawn } from 'node:child_process';

if (process.env.E2E_ENABLED !== 'true') {
  console.log('Skipping e2e tests. Set E2E_ENABLED=true to run service-backed tests.');
  process.exit(0);
}

const child = spawn('vitest', ['run'], { stdio: 'inherit', shell: true });
child.on('exit', (code, signal) => {
  if (signal) {
    console.error(`vitest terminated by signal ${signal}`);
    process.exit(1);
  }
  process.exit(code ?? 1);
});
