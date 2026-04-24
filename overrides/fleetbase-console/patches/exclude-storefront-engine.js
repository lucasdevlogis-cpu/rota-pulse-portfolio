const fs = require('fs');
const path = require('path');

const packageName = '@fleetbase/ember-core';
const targetPath = path.join('addon', 'utils', 'load-installed-extensions.js');
const storefrontEngine = "'@fleetbase/storefront-engine',";
const excludedBlock = "const ROTA_PULSE_EXCLUDED_CORE_ENGINES = ['@fleetbase/storefront-engine'];";

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

        const scopedPackage = path.join(current, '@fleetbase', 'ember-core');
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
            if (entry.name === '.pnpm' || entry.name.startsWith('@fleetbase') || entry.name.includes('ember-core')) {
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

let matched = 0;
let patched = 0;
for (const packageRoot of packageRoots) {
    const file = path.join(packageRoot, targetPath);
    if (!fs.existsSync(file)) {
        continue;
    }

    matched++;
    const original = fs.readFileSync(file, 'utf8');
    let updated = original;

    if (!updated.includes(excludedBlock)) {
        updated = updated.replace(
            "export default async function loadInstalledExtensions(additionalCoreEngines = []) {",
            `${excludedBlock}\n\nexport default async function loadInstalledExtensions(additionalCoreEngines = []) {`
        );
    }

    updated = updated.replace(new RegExp(`\\n\\s*${storefrontEngine.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), '');

    if (!updated.includes('ROTA_PULSE_EXCLUDED_CORE_ENGINES.includes(pkg.name)')) {
        updated = updated.replace(
            'return isInstalledEngine(pkg.name);',
            'return !ROTA_PULSE_EXCLUDED_CORE_ENGINES.includes(pkg.name) && isInstalledEngine(pkg.name);'
        );
    }

    if (updated !== original) {
        fs.writeFileSync(file, updated);
        patched++;
        console.log(`[exclude-storefront-engine] patched ${path.relative(process.cwd(), file)}`);
    }
}

if (matched === 0) {
    throw new Error('No ember-core load-installed-extensions.js files were found.');
}

if (patched === 0) {
    console.log('[exclude-storefront-engine] storefront engine already excluded');
}
