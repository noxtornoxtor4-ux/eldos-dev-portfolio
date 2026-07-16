import { cpSync, copyFileSync, mkdirSync, readdirSync, renameSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const kit = join(root, '.svelte-kit');
const cloudflare = join(kit, 'cloudflare');
const dist = join(root, 'dist');

rmSync(dist, { recursive: true, force: true });
mkdirSync(join(dist, 'server'), { recursive: true });
mkdirSync(join(dist, 'client'), { recursive: true });
mkdirSync(join(dist, '.openai'), { recursive: true });

copyFileSync(join(root, 'scripts', 'sites-worker.js'), join(dist, 'server', 'index.js'));
copyFileSync(join(root, '.openai', 'hosting.json'), join(dist, '.openai', 'hosting.json'));

for (const entry of readdirSync(cloudflare, { withFileTypes: true })) {
	if (entry.name === '_worker.js') continue;
	cpSync(join(cloudflare, entry.name), join(dist, 'client', entry.name), { recursive: true });
}

renameSync(join(dist, 'client', 'index.html'), join(dist, 'client', 'site.html'));
