const fs = require('fs');
const path = require('path');

const packageName = '@fleetbase/fleetops-engine';
const routePath = path.join('addon', 'routes', 'operations', 'routes', 'index', 'details.js');
const templatePath = path.join('addon', 'templates', 'operations', 'routes', 'index', 'details.hbs');
const patchedRoute = `import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class OperationsRoutesIndexDetailsRoute extends Route {
    @service store;

    model({ public_id }) {
        return this.store.findRecord('route', public_id);
    }
}
`;
const patchedTemplate = `{{outlet}}
`;

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

let matched = 0;
let patched = 0;
for (const packageRoot of packageRoots) {
    const routeFile = path.join(packageRoot, routePath);
    if (fs.existsSync(routeFile)) {
        matched++;

        const original = fs.readFileSync(routeFile, 'utf8');
        if (original !== patchedRoute) {
            if (!original.includes('export default class OperationsRoutesIndexDetailsRoute extends Route')) {
                throw new Error(`Unexpected FleetOps routes details route content in ${routeFile}.`);
            }

            fs.writeFileSync(routeFile, patchedRoute);
            patched++;
            console.log(`[fleetops-routes-details] patched ${path.relative(process.cwd(), routeFile)}`);
        }
    }

    const templateFile = path.join(packageRoot, templatePath);
    if (fs.existsSync(templateFile)) {
        matched++;

        const original = fs.readFileSync(templateFile, 'utf8');
        if (original !== patchedTemplate) {
            if (!original.includes('{{page-title "Details"}}')) {
                throw new Error(`Unexpected FleetOps routes details template content in ${templateFile}.`);
            }

            fs.writeFileSync(templateFile, patchedTemplate);
            patched++;
            console.log(`[fleetops-routes-details] patched ${path.relative(process.cwd(), templateFile)}`);
        }
    }
}

if (matched === 0) {
    throw new Error('No FleetOps routes details files were found.');
}

if (patched === 0) {
    console.log('[fleetops-routes-details] routes details files already patched');
}
