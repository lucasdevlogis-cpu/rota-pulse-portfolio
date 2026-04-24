const fs = require('fs');
const path = require('path');

const packageName = '@fleetbase/fleetops-engine';
const templatePath = path.join('addon', 'templates', 'operations', 'routes', 'index.hbs');

function findPackageRoots(startDir) {
    const roots = [];
    const pending = [startDir];
    const seen = new Set();

    while (pending.length > 0) {
        const current = pending.pop();
        if (!current || seen.has(current)) {
            continue;
        }
        seen.add(current);

        let entries;
        try {
            entries = fs.readdirSync(current, { withFileTypes: true });
        } catch {
            continue;
        }

        const scopedPackage = path.join(current, '@fleetbase', 'fleetops-engine');
        if (fs.existsSync(path.join(scopedPackage, 'package.json'))) {
            roots.push(scopedPackage);
        }

        for (const entry of entries) {
            if (!entry.isDirectory()) {
                continue;
            }

            if (entry.name === '.cache' || entry.name === '.git') {
                continue;
            }

            const child = path.join(current, entry.name);
            if (entry.name === '.pnpm' || entry.name.startsWith('@fleetbase') || entry.name.includes('fleetops-engine')) {
                pending.push(child);
            }
        }
    }

    return [...new Set(roots)];
}

const packageRoots = findPackageRoots(path.join(process.cwd(), 'node_modules'));
if (packageRoots.length === 0) {
    throw new Error(`Unable to find ${packageName} under node_modules.`);
}

let patched = 0;
for (const packageRoot of packageRoots) {
    const file = path.join(packageRoot, templatePath);
    if (!fs.existsSync(file)) {
        continue;
    }

    const original = fs.readFileSync(file, 'utf8');
    const updated = original.replace(/<LiveMap/g, '<Map::LeafletLiveMap').replace(/<\/LiveMap>/g, '</Map::LeafletLiveMap>');

    if (updated !== original) {
        fs.writeFileSync(file, updated);
        patched++;
        console.log(`[fleetops-live-map] patched ${path.relative(process.cwd(), file)}`);
    }
}

if (patched === 0) {
    throw new Error('No FleetOps routes live map template was patched.');
}
