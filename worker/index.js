import { register } from 'ts-node';

register({
  transpileOnly: true,
  esm: true,
});

import('./index.ts').catch((error) => {
  console.error('Failed to start Agora Agent worker:', error);
  process.exit(1);
});
