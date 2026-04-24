const fs = require('fs');
const path = require('path');

function replaceOrThrow(content, searchValue, replaceValue, context) {
    if (content.includes(replaceValue)) {
        return content;
    }

    if (!content.includes(searchValue)) {
        throw new Error(`Unexpected content while patching ${context}.`);
    }

    return content.replace(searchValue, replaceValue);
}

function replaceRegexOrThrow(content, pattern, replaceValue, context) {
    if (content.includes(replaceValue)) {
        return content;
    }

    if (!pattern.test(content)) {
        throw new Error(`Unexpected content while patching ${context}.`);
    }

    return content.replace(pattern, replaceValue);
}

function patchFile(file, transform, label) {
    if (!fs.existsSync(file)) {
        throw new Error(`File not found for ${label}: ${file}`);
    }

    const original = fs.readFileSync(file, 'utf8');
    const updated = transform(original);

    if (updated !== original) {
        fs.writeFileSync(file, updated);
        console.log(`[rotapulse-branding-assets] patched ${path.relative(process.cwd(), file)}`);
        return true;
    }

    return false;
}

function findPackageRoots(packageName) {
    const roots = [];
    const pending = [path.join(process.cwd(), 'node_modules')];
    const seen = new Set();
    const packageSegments = packageName.split('/');

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

        const packageRoot = path.join(current, ...packageSegments);
        if (fs.existsSync(path.join(packageRoot, 'package.json'))) {
            roots.push(packageRoot);
        }

        for (const entry of entries) {
            if (!entry.isDirectory()) {
                continue;
            }

            if (entry.name === '.cache' || entry.name === '.git') {
                continue;
            }

            const child = path.join(current, entry.name);
            if (
                entry.name === '.pnpm' ||
                entry.name.startsWith('@fleetbase') ||
                entry.name.includes(packageSegments[packageSegments.length - 1])
            ) {
                pending.push(child);
            }
        }
    }

    return [...new Set(roots)];
}

function patchPackageFile(packageName, relativeFile, transform) {
    const packageRoots = findPackageRoots(packageName);
    if (packageRoots.length === 0) {
        throw new Error(`Unable to find ${packageName} under node_modules.`);
    }

    let matched = 0;
    let patched = 0;

    for (const packageRoot of packageRoots) {
        const file = path.join(packageRoot, relativeFile);
        if (!fs.existsSync(file)) {
            continue;
        }

        matched++;
        if (patchFile(file, transform, `${packageName}/${relativeFile}`)) {
            patched++;
        }
    }

    if (matched === 0) {
        throw new Error(`No files matched ${packageName}/${relativeFile}.`);
    }

    if (patched === 0) {
        console.log(`[rotapulse-branding-assets] ${packageName}/${relativeFile} already patched`);
    }
}

const normalizeBrandFunction = `function normalizeBrand(brand) {
    if (!brand) {
        return brand;
    }

    const logoUrl = brand.logo_url || '';
    const iconUrl = brand.icon_url || '';

    if (!logoUrl || /fleetbase|flb-assets/i.test(logoUrl)) {
        brand.logo_url = '/images/fleetbase-logo-svg.svg';
    }

    if (!iconUrl || /fleetbase|flb-assets/i.test(iconUrl)) {
        brand.icon_url = '/images/icon.svg';
    }

    return brand;
}
`;

patchFile(path.join(process.cwd(), 'app', 'index.html'), (content) => {
    let updated = content;

    updated = replaceRegexOrThrow(
        updated,
        /<link rel="icon" type="image\/png" sizes="32x32" href="\/favicon\/favicon-32x32\.png" \/>\r?\n    <link rel="icon" type="image\/png" sizes="16x16" href="\/favicon\/favicon-16x16\.png" \/>\r?\n    <link rel="apple-touch-icon" sizes="180x180" href="\/favicon\/apple-touch-icon\.png" \/>\r?\n    <link rel="icon" type="image\/png" sizes="192x192" href="\/favicon\/android-chrome-192x192\.png" \/>\r?\n    <link rel="icon" type="image\/png" sizes="256x256" href="\/favicon\/android-chrome-256x256\.png" \/>\r?\n    <link rel="manifest" href="\/favicon\/site\.webmanifest" \/>\r?\n    <link rel="mask-icon" href="\/favicon\/safari-pinned-tab\.svg" color="#5bbad5" \/>/,
        `    <link rel="icon" type="image/svg+xml" href="/images/icon.svg" />
    <link rel="apple-touch-icon" href="/images/icon.svg" />
    <link rel="manifest" href="/favicon/site.webmanifest" />
    <link rel="mask-icon" href="/images/icon.svg" color="#14b8a6" />`,
        'app/index.html icons'
    );

    updated = replaceOrThrow(
        updated,
        '<span class="fleetbase-loader" width="16" height="16"></span>',
        '<img src="/images/icon.svg" alt="Rota Pulse" width="48" height="48" class="h-12 w-12 rounded-md" />',
        'app/index.html loader'
    );

    return updated;
}, 'app/index.html');

patchFile(path.join(process.cwd(), 'app', 'routes', 'console.js'), (content) => {
    let updated = content;

    updated = replaceRegexOrThrow(
        updated,
        /import removeBootLoader from '\.\.\/utils\/remove-boot-loader';\r?\nimport '@fleetbase\/leaflet-routing-machine';/,
        `import removeBootLoader from '../utils/remove-boot-loader';
import '@fleetbase/leaflet-routing-machine';

${normalizeBrandFunction.trimEnd()}`,
        'app/routes/console.js normalize import'
    );

    updated = replaceOrThrow(
        updated,
        "        return this.store.findRecord('brand', 1);",
        "        return this.store.findRecord('brand', 1).then(normalizeBrand);",
        'app/routes/console.js brand model'
    );

    return updated;
}, 'app/routes/console.js');

patchFile(path.join(process.cwd(), 'app', 'routes', 'console', 'home.js'), (content) => {
    let updated = content;

    updated = replaceOrThrow(
        updated,
        "import Route from '@ember/routing/route';",
        `import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';`,
        'app/routes/console/home.js import'
    );

    updated = replaceOrThrow(
        updated,
        'export default class ConsoleHomeRoute extends Route {}',
        `export default class ConsoleHomeRoute extends Route {
    @service router;

    beforeModel() {
        return this.router.transitionTo('console.virtual', 'fleet-ops');
    }
}`,
        'app/routes/console/home.js redirect'
    );

    return updated;
}, 'app/routes/console/home.js');

patchFile(path.join(process.cwd(), 'app', 'routes', 'onboard', 'index.js'), (content) => {
    let updated = content;

    updated = replaceRegexOrThrow(
        updated,
        /import \{ inject as service \} from '@ember\/service';/,
        `import { inject as service } from '@ember/service';

${normalizeBrandFunction.trimEnd()}`,
        'app/routes/onboard/index.js normalize import'
    );

    updated = replaceOrThrow(
        updated,
        "        return this.store.findRecord('brand', 1);",
        "        return this.store.findRecord('brand', 1).then(normalizeBrand);",
        'app/routes/onboard/index.js brand model'
    );

    return updated;
}, 'app/routes/onboard/index.js');

patchFile(path.join(process.cwd(), 'app', 'routes', 'invite', 'for-user.js'), (content) => {
    let updated = content;

    updated = replaceRegexOrThrow(
        updated,
        /import \{ inject as service \} from '@ember\/service';/,
        `import { inject as service } from '@ember/service';

${normalizeBrandFunction.trimEnd()}`,
        'app/routes/invite/for-user.js normalize import'
    );

    updated = replaceOrThrow(
        updated,
        "        return this.store.findRecord('brand', 1);",
        "        return this.store.findRecord('brand', 1).then(normalizeBrand);",
        'app/routes/invite/for-user.js brand model'
    );

    return updated;
}, 'app/routes/invite/for-user.js');

patchFile(path.join(process.cwd(), 'app', 'controllers', 'console', 'admin', 'branding.js'), (content) => {
    let updated = content;

    updated = replaceOrThrow(updated, "this.model.set('icon_url', '/images/icon.png');", "this.model.set('icon_url', '/images/icon.svg');", 'app/controllers/console/admin/branding.js unset icon');
    updated = replaceOrThrow(updated, "this.model.set('icon_url', '/images/icon.png');", "this.model.set('icon_url', '/images/icon.svg');", 'app/controllers/console/admin/branding.js save icon');

    return updated;
}, 'app/controllers/console/admin/branding.js');

patchPackageFile('@fleetbase/ember-ui', path.join('addon', 'components', 'logo-icon.js'), (content) => {
    let updated = content;

    updated = replaceRegexOrThrow(
        updated,
        /import \{ task \} from 'ember-concurrency';/,
        `import { task } from 'ember-concurrency';

${normalizeBrandFunction.trimEnd()}`,
        '@fleetbase/ember-ui/addon/components/logo-icon.js normalize import'
    );

    updated = replaceOrThrow(
        updated,
        '            this.brand = this.args.brand;',
        '            this.brand = normalizeBrand(this.args.brand);',
        '@fleetbase/ember-ui/addon/components/logo-icon.js args brand'
    );

    updated = replaceOrThrow(
        updated,
        "            this.brand = yield this.store.findRecord('brand', 1);",
        "            this.brand = normalizeBrand(yield this.store.findRecord('brand', 1));",
        '@fleetbase/ember-ui/addon/components/logo-icon.js load icon'
    );

    return updated;
});

patchPackageFile('@fleetbase/ember-ui', path.join('addon', 'components', 'logo-icon.hbs'), (content) => {
    let updated = content;

    updated = replaceOrThrow(updated, '@fallbackSrc="/images/icon.png"', '@fallbackSrc="/images/icon.svg"', '@fleetbase/ember-ui/addon/components/logo-icon.hbs fallback');
    updated = replaceOrThrow(updated, 'alt="Fleetbase"', 'alt="Rota Pulse"', '@fleetbase/ember-ui/addon/components/logo-icon.hbs alt');

    return updated;
});
