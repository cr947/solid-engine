import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

function findFileUpwards(filename: string, startDir: string): string | undefined {
  let dir = startDir;
  while (true) {
    const candidate = join(dir, filename);
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return undefined;
}

function loadEnvLocal() {
  const moduleDir = dirname(fileURLToPath(import.meta.url));
  const cwdPath = findFileUpwards('.env.local', process.cwd());
  const modulePath = findFileUpwards('.env.local', moduleDir);
  const envPath = cwdPath ?? modulePath;

  console.log('loadEnvLocal', {
    cwd: process.cwd(),
    moduleDir,
    cwdPath,
    modulePath,
    envPath,
    envFileExistsCwd: existsSync(join(process.cwd(), '.env.local')),
    envFileExistsModule: existsSync(join(moduleDir, '..', '.env.local')),
    processEnvHasUrl: Boolean(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL),
    processEnvHasKey: Boolean(
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ),
  });

  if (!envPath) return;

  const raw = readFileSync(envPath, 'utf8');
  console.log('loaded env file', envPath, raw.slice(0, 200));
  raw.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) return;
    const [key, ...rest] = trimmed.split('=');
    const name = key.trim();
    const value = rest.join('=').trim();
    console.log('loading env line', name, value ? 'set' : 'empty', process.env[name]);
    if (!process.env[name] && value !== '') {
      process.env[name] = value;
    }
  });
}

loadEnvLocal();

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL, and missing SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables'
  );
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  },
});
