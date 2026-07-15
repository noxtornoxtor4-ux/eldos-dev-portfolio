import { cpSync, copyFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const kit = join(root, '.svelte-kit');
const cloudflare = join(kit, 'cloudflare');
const dist = join(root, 'dist');

rmSync(dist, { recursive: true, force: true });
mkdirSync(join(dist, 'server'), { recursive: true });
mkdirSync(join(dist, 'client'), { recursive: true });

copyFileSync(join(cloudflare, '_worker.js'), join(dist, 'server', 'index.js'));
cpSync(join(kit, 'output', 'server'), join(dist, 'output', 'server'), { recursive: true });
cpSync(join(kit, 'cloudflare-tmp'), join(dist, 'cloudflare-tmp'), { recursive: true });

for (const entry of readdirSync(cloudflare, { withFileTypes: true })) {
	if (entry.name === '_worker.js') continue;
	cpSync(join(cloudflare, entry.name), join(dist, 'client', entry.name), { recursive: true });
}
