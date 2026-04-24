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
        console.log(`[rotapulse-branding-ptbr] patched ${path.relative(process.cwd(), file)}`);
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
        console.log(`[rotapulse-branding-ptbr] ${packageName}/${relativeFile} already patched`);
    }
}

const rootPatches = [
    {
        file: path.join(process.cwd(), 'translations', 'pt-br.yaml'),
        transform(content) {
            let updated = replaceRegexOrThrow(content, /app:\r?\n  name: Fleetbase/, 'app:\n  name: Rota Pulse', 'translations/pt-br.yaml');
            updated = replaceRegexOrThrow(
                updated,
                /  save-changes: .*/,
                `  save-changes: Salvar Altera\u00e7\u00f5es
  your-profile: Seu perfil
  date-of-birth: Data de nascimento`,
                'translations/pt-br.yaml residual common keys'
            );
            updated = replaceRegexOrThrow(updated, /  time-zone: .*/, '  time-zone: Fuso Hor\u00e1rio\n  timezone: Fuso hor\u00e1rio', 'translations/pt-br.yaml timezone');
            return updated;
        },
    },
    {
        file: path.join(process.cwd(), 'translations', 'en-us.yaml'),
        transform(content) {
            return replaceRegexOrThrow(content, /app:\r?\n  name: Fleetbase/, 'app:\n  name: Rota Pulse', 'translations/en-us.yaml');
        },
    },
    {
        file: path.join(process.cwd(), 'app', 'routes', 'application.js'),
        transform(content) {
            return replaceOrThrow(
                content,
                "const locale = this.currentUser.getOption('locale', 'en-US');",
                "const locale = this.currentUser.getOption('locale', 'pt-br');",
                'app/routes/application.js'
            );
        },
    },
    {
        file: path.join(process.cwd(), 'app', 'index.html'),
        transform(content) {
            let updated = replaceOrThrow(content, '<title>Fleetbase Console</title>', '<title>Rota Pulse</title>', 'app/index.html title');
            updated = replaceOrThrow(updated, '<div class="loading-message">Starting up...</div>', '<div class="loading-message">Iniciando...</div>', 'app/index.html boot loader');
            return updated;
        },
    },
    {
        file: path.join(process.cwd(), 'app', 'utils', 'get-service-name.js'),
        transform(content) {
            const patched = `export default function getServiceName(serviceName) {
    const normalized = (serviceName || '').toLowerCase();

    if (normalized.startsWith('fleet')) {
        return 'Operações';
    }

    if (normalized.startsWith('iam') || normalized.startsWith('identity')) {
        return 'IAM';
    }

    if (normalized.startsWith('auth')) {
        return 'Autenticação';
    }

    if (normalized.startsWith('developers')) {
        return 'Desenvolvedores';
    }

    if (normalized.startsWith('ledger')) {
        return 'Financeiro';
    }

    if (normalized.startsWith('extensions') || normalized.startsWith('registry')) {
        return 'Extensões';
    }

    return 'N/A';
}
`;

            return replaceRegexOrThrow(
                content,
                /export default function getServiceName\(serviceName\) \{[\s\S]*?return 'N\/A';\r?\n\}/,
                patched.trimEnd(),
                'app/utils/get-service-name.js'
            );
        },
    },
    {
        file: path.join(process.cwd(), 'app', 'templates', 'console', 'settings.hbs'),
        transform(content) {
            let updated = replaceOrThrow(content, '{{t "common.organization"}}', 'Organização', 'app/templates/console/settings.hbs organization');
            updated = replaceOrThrow(updated, '{{t "common.two-factor"}}', 'Dois fatores', 'app/templates/console/settings.hbs two-factor');
            return updated;
        },
    },
    {
        file: path.join(process.cwd(), 'app', 'controllers', 'console', 'settings', 'index.js'),
        transform(content) {
            return replaceOrThrow(
                content,
                "            this.notifications.success('Organization changes successfully saved.');",
                "            this.notifications.success('Alterações da organização salvas com sucesso.');",
                'app/controllers/console/settings/index.js success notification'
            );
        },
    },
    {
        file: path.join(process.cwd(), 'app', 'templates', 'console', 'account.hbs'),
        transform(content) {
            let updated = replaceOrThrow(content, '{{page-title "Account"}}', '{{page-title "Conta"}}', 'app/templates/console/account.hbs title');
            updated = replaceOrThrow(updated, '>Profile<', '>Perfil<', 'app/templates/console/account.hbs profile');
            updated = replaceOrThrow(updated, '>Auth<', '>Autenticação<', 'app/templates/console/account.hbs auth');
            updated = replaceOrThrow(updated, '>Organizations<', '>Organizações<', 'app/templates/console/account.hbs organizations');
            return updated;
        },
    },
    {
        file: path.join(process.cwd(), 'app', 'templates', 'console', 'account', 'organizations.hbs'),
        transform(content) {
            let updated = replaceOrThrow(content, '{{page-title "Organizations"}}', '{{page-title "Organizações"}}', 'app/templates/console/account/organizations.hbs title');
            updated = replaceOrThrow(updated, '@title="Organizations"', '@title="Organizações"', 'app/templates/console/account/organizations.hbs header');
            updated = replaceOrThrow(updated, '@text="Create Organization"', '@text="Criar organização"', 'app/templates/console/account/organizations.hbs create');
            updated = replaceOrThrow(updated, '@title="Your Organizations"', '@title="Suas organizações"', 'app/templates/console/account/organizations.hbs panel');
            updated = replaceOrThrow(updated, 'Member Since:', 'Membro desde:', 'app/templates/console/account/organizations.hbs member since');
            updated = replaceOrThrow(updated, '@text="Leave"', '@text="Sair"', 'app/templates/console/account/organizations.hbs leave');
            updated = replaceOrThrow(updated, '@text="Switch"', '@text="Trocar"', 'app/templates/console/account/organizations.hbs switch');
            updated = replaceOrThrow(updated, '@text="Edit"', '@text="Editar"', 'app/templates/console/account/organizations.hbs edit');
            updated = replaceOrThrow(updated, '@text="Delete"', '@text="Excluir"', 'app/templates/console/account/organizations.hbs delete');
            return updated;
        },
    },
    {
        file: path.join(process.cwd(), 'app', 'controllers', 'console', 'account', 'index.js'),
        transform(content) {
            let updated = replaceOrThrow(content, "                this.notifications.success('Profile changes saved.');", "                this.notifications.success('Altera\u00e7\u00f5es do perfil salvas com sucesso.');", 'app/controllers/console/account/index.js success');
            updated = replaceOrThrow(updated, "            body: 'You must validate your password to update the account email address.',", "            body: 'Voc\u00ea precisa validar sua senha para atualizar o email da conta.',", 'app/controllers/console/account/index.js validate password');
            return updated;
        },
    },
    {
        file: path.join(process.cwd(), 'app', 'templates', 'console', 'account', 'auth.hbs'),
        transform(content) {
            let updated = replaceOrThrow(content, '{{page-title "Account Auth"}}', '{{page-title "Autentica\u00e7\u00e3o da conta"}}', 'app/templates/console/account/auth.hbs title');
            updated = replaceOrThrow(updated, '@title="Account Auth"', '@title="Autentica\u00e7\u00e3o da conta"', 'app/templates/console/account/auth.hbs header');
            updated = replaceOrThrow(updated, '@title="Change Password"', '@title="Alterar senha"', 'app/templates/console/account/auth.hbs panel');
            updated = replaceOrThrow(updated, '>Change Password<', '>Alterar senha<', 'app/templates/console/account/auth.hbs legend');
            updated = replaceOrThrow(updated, '@name="Enter new Password"', '@name="Nova senha"', 'app/templates/console/account/auth.hbs new password');
            updated = replaceOrThrow(updated, '@name="Confirm Password"', '@name="Confirmar senha"', 'app/templates/console/account/auth.hbs confirm password');
            updated = replaceOrThrow(updated, '@text="Confirm & Change Password"', '@text="Confirmar e alterar senha"', 'app/templates/console/account/auth.hbs confirm button');
            updated = replaceOrThrow(updated, '@title="2FA Settings"', '@title="Configura\u00e7\u00f5es de 2FA"', 'app/templates/console/account/auth.hbs 2fa panel');
            updated = replaceOrThrow(updated, '@loadingMessage="Loading User 2FA Settings..."', '@loadingMessage="Carregando configura\u00e7\u00f5es de 2FA do usu\u00e1rio..."', 'app/templates/console/account/auth.hbs 2fa loading');
            updated = replaceOrThrow(updated, '@text="Save 2FA Settings"', '@text="Salvar configura\u00e7\u00f5es de 2FA"', 'app/templates/console/account/auth.hbs 2fa button');
            return updated;
        },
    },
    {
        file: path.join(process.cwd(), 'app', 'controllers', 'console', 'account', 'auth.js'),
        transform(content) {
            let updated = replaceOrThrow(content, "            this.notifications.success('Password change successfully.');", "            this.notifications.success('Senha alterada com sucesso.');", 'app/controllers/console/account/auth.js password success');
            updated = replaceOrThrow(updated, "            this.notifications.serverError(error, 'Failed to change password.');", "            this.notifications.serverError(error, 'Falha ao alterar a senha.');", 'app/controllers/console/account/auth.js password fail');
            updated = replaceOrThrow(updated, "            body: 'You must validate your current password before it can be changed.',", "            body: 'Voc\u00ea precisa validar a senha atual antes de alter\u00e1-la.',", 'app/controllers/console/account/auth.js validate');
            updated = replaceOrThrow(updated, "            this.notifications.success('2FA Settings saved successfully.');", "            this.notifications.success('Configura\u00e7\u00f5es de 2FA salvas com sucesso.');", 'app/controllers/console/account/auth.js 2fa success');
            return updated;
        },
    },
    {
        file: path.join(process.cwd(), 'app', 'components', 'two-fa-settings.hbs'),
        transform(content) {
            let updated = replaceOrThrow(content, '>Enable Two-Factor Authentication<', '>Ativar autentica\u00e7\u00e3o de dois fatores<', 'app/components/two-fa-settings.hbs enable');
            updated = replaceOrThrow(updated, '>Require Users to Set-Up 2FA<', '>Exigir que usu\u00e1rios configurem 2FA<', 'app/components/two-fa-settings.hbs enforce');
            updated = replaceOrThrow(updated, '>Choose an authentication method<', '>Escolha um m\u00e9todo de autentica\u00e7\u00e3o<', 'app/components/two-fa-settings.hbs choose');
            updated = replaceOrThrow(updated, `>In addition to your username and password, you'll have to enter a code (delivered via app or SMS) to sign in to your account<`, '>Al\u00e9m do usu\u00e1rio e da senha, voc\u00ea precisar\u00e1 informar um c\u00f3digo recebido por aplicativo ou SMS para entrar na conta<', 'app/components/two-fa-settings.hbs helper');
            updated = replaceOrThrow(updated, '>Recommended<', '>Recomendado<', 'app/components/two-fa-settings.hbs recommended');
            return updated;
        },
    },
    {
        file: path.join(process.cwd(), 'app', 'templates', 'console', 'admin.hbs'),
        transform(content) {
            let updated = replaceOrThrow(content, '{{page-title "Admin"}}', '{{page-title "Administra\u00e7\u00e3o"}}', 'app/templates/console/admin.hbs title');
            updated = replaceOrThrow(updated, '@title="System Config"', '@title="Configura\u00e7\u00e3o do sistema"', 'app/templates/console/admin.hbs system config');
            return updated;
        },
    },
    {
        file: path.join(process.cwd(), 'app', 'templates', 'console', 'admin', 'two-fa-settings.hbs'),
        transform(content) {
            let updated = replaceOrThrow(content, '{{page-title "2FA Config"}}', '{{page-title "Configura\u00e7\u00e3o de 2FA"}}', 'app/templates/console/admin/two-fa-settings.hbs title');
            updated = replaceOrThrow(updated, '<Layout::Section::Header @title="2FA Config">', '<Layout::Section::Header @title="Configura\u00e7\u00e3o de 2FA">', 'app/templates/console/admin/two-fa-settings.hbs header');
            updated = replaceOrThrow(updated, '<ContentPanel @title="2FA Config" @open={{true}} @wrapperClass="bordered-classic">', '<ContentPanel @title="Configura\u00e7\u00e3o de 2FA" @open={{true}} @wrapperClass="bordered-classic">', 'app/templates/console/admin/two-fa-settings.hbs panel');
            updated = replaceOrThrow(updated, '@loadingMessage="Loading 2FA Config..."', '@loadingMessage="Carregando configura\u00e7\u00e3o de 2FA..."', 'app/templates/console/admin/two-fa-settings.hbs loading');
            return updated;
        },
    },
    {
        file: path.join(process.cwd(), 'app', 'controllers', 'console', 'admin', 'two-fa-settings.js'),
        transform(content) {
            return replaceOrThrow(content, "                this.notifications.success('2FA Settings saved for admin successfully.');", "                this.notifications.success('Configura\u00e7\u00f5es de 2FA salvas com sucesso no admin.');", 'app/controllers/console/admin/two-fa-settings.js success');
        },
    },
    {
        file: path.join(process.cwd(), 'app', 'controllers', 'console', 'admin', 'organizations', 'index.js'),
        transform(content) {
            let updated = replaceOrThrow(content, "            label: this.intl.t('common.name'),", "            label: 'Nome',", 'app/controllers/console/admin/organizations/index.js name');
            updated = replaceOrThrow(updated, "            label: this.intl.t('console.admin.organizations.index.owner-name-column'),", "            label: 'Propriet\u00e1rio',", 'app/controllers/console/admin/organizations/index.js owner');
            updated = replaceOrThrow(updated, "            label: this.intl.t('console.admin.organizations.index.owner-email-column'),", "            label: 'Email do propriet\u00e1rio',", 'app/controllers/console/admin/organizations/index.js owner email');
            updated = replaceOrThrow(updated, "            label: this.intl.t('console.admin.organizations.index.phone-column'),", "            label: 'Telefone do propriet\u00e1rio',", 'app/controllers/console/admin/organizations/index.js phone');
            updated = replaceOrThrow(updated, "            label: this.intl.t('console.admin.organizations.index.users-count-column'),", "            label: 'Usu\u00e1rios',", 'app/controllers/console/admin/organizations/index.js users');
            updated = replaceOrThrow(updated, "            label: this.intl.t('common.created-at'),", "            label: 'Criado em',", 'app/controllers/console/admin/organizations/index.js created');
            return updated;
        },
    },
    {
        file: path.join(process.cwd(), 'app', 'controllers', 'console', 'admin', 'organizations', 'index', 'users.js'),
        transform(content) {
            let updated = replaceOrThrow(content, "            ddMenuLabel: 'User Actions',", "            ddMenuLabel: 'A\u00e7\u00f5es do usu\u00e1rio',", 'app/controllers/console/admin/organizations/index/users.js menu');
            updated = replaceOrThrow(updated, "                    label: 'Impersonate',", "                    label: 'Representar usu\u00e1rio',", 'app/controllers/console/admin/organizations/index/users.js impersonate');
            updated = replaceOrThrow(updated, "                    label: 'Change Password',", "                    label: 'Alterar senha',", 'app/controllers/console/admin/organizations/index/users.js change password');
            updated = replaceOrThrow(updated, "            this.notifications.info(`Now impersonating ${user.email}...`);", "            this.notifications.info(`Agora representando ${user.email}...`);", 'app/controllers/console/admin/organizations/index/users.js notify');
            return updated;
        },
    },
];

for (const patch of rootPatches) {
    patchFile(patch.file, patch.transform, patch.file);
}

patchPackageFile('@fleetbase/fleetops-engine', path.join('addon', 'extension.js'), (content) => {
    let updated = content;
    updated = replaceOrThrow(updated, "registerHeaderMenuItem('Fleet-Ops'", "registerHeaderMenuItem('Operações'", '@fleetbase/fleetops-engine title');
    updated = replaceOrThrow(updated, "description: 'Dispatch, fleet management, driver tracking, and logistics operations.'", "description: 'Despacho, gestão de frota, rastreamento de motoristas e operações logísticas.'", '@fleetbase/fleetops-engine description');
    updated = replaceOrThrow(updated, "title: 'Orders'", "title: 'Pedidos'", '@fleetbase/fleetops-engine shortcuts orders');
    updated = replaceOrThrow(updated, "description: 'Create, dispatch, and track delivery orders in real time.'", "description: 'Crie, despache e acompanhe pedidos em tempo real.'", '@fleetbase/fleetops-engine shortcuts orders description');
    updated = replaceOrThrow(updated, "title: 'Places'", "title: 'Locais'", '@fleetbase/fleetops-engine shortcuts places');
    updated = replaceOrThrow(updated, "description: 'Manage saved locations, addresses, and points of interest.'", "description: 'Gerencie locais salvos, endereços e pontos de interesse.'", '@fleetbase/fleetops-engine shortcuts places description');
    updated = replaceOrThrow(updated, "title: 'Drivers'", "title: 'Motoristas'", '@fleetbase/fleetops-engine shortcuts drivers');
    updated = replaceOrThrow(updated, "description: 'Manage driver profiles, assignments, and live locations.'", "description: 'Gerencie perfis, atribuições e posições dos motoristas.'", '@fleetbase/fleetops-engine shortcuts drivers description');
    updated = replaceOrThrow(updated, "title: 'Vehicles'", "title: 'Veículos'", '@fleetbase/fleetops-engine shortcuts vehicles');
    updated = replaceOrThrow(updated, "description: 'View and manage your vehicle fleet and telematics.'", "description: 'Visualize e gerencie a frota e a telemática dos veículos.'", '@fleetbase/fleetops-engine shortcuts vehicles description');
    updated = replaceOrThrow(updated, "title: 'Fleets'", "title: 'Frotas'", '@fleetbase/fleetops-engine shortcuts fleets');
    updated = replaceOrThrow(updated, "description: 'Organise drivers and vehicles into operational fleets.'", "description: 'Organize motoristas e veículos em frotas operacionais.'", '@fleetbase/fleetops-engine shortcuts fleets description');
    updated = replaceOrThrow(updated, "title: 'Service Rates'", "title: 'Tarifas de serviço'", '@fleetbase/fleetops-engine shortcuts rates');
    updated = replaceOrThrow(updated, "description: 'Configure pricing rules and service rate cards.'", "description: 'Configure regras de preço e tabelas de serviço.'", '@fleetbase/fleetops-engine shortcuts rates description');
    updated = replaceOrThrow(updated, "title: 'Devices'", "title: 'Dispositivos'", '@fleetbase/fleetops-engine shortcuts devices');
    updated = replaceOrThrow(updated, "description: 'Manage connected telematics devices and their sensor data.'", "description: 'Gerencie dispositivos conectados e seus dados de sensores.'", '@fleetbase/fleetops-engine shortcuts devices description');
    updated = replaceOrThrow(updated, "title: 'Reports'", "title: 'Relatórios'", '@fleetbase/fleetops-engine shortcuts reports');
    updated = replaceOrThrow(updated, "description: 'Generate and review operational analytics reports.'", "description: 'Gere e revise relatórios analíticos da operação.'", '@fleetbase/fleetops-engine shortcuts reports description');
    updated = replaceOrThrow(updated, "'Fleet-Ops Config'", "'Configuração de operações'", '@fleetbase/fleetops-engine admin panel');
    updated = replaceOrThrow(updated, "title: 'Navigator App'", "title: 'Aplicativo Navigator'", '@fleetbase/fleetops-engine admin item');
    updated = replaceOrThrow(updated, "title: 'Track Order'", "title: 'Rastrear pedido'", '@fleetbase/fleetops-engine login action');
    updated = replaceOrThrow(updated, "wrapperClass: 'btn-block py-1 border dark:border-gray-700 border-gray-200 hover:opacity-50'", "wrapperClass: 'hidden'", '@fleetbase/fleetops-engine login action visibility');
    return updated;
});

patchPackageFile('@fleetbase/ember-ui', path.join('addon', 'components', 'pagination.hbs'), (content) => {
    let updated = content;
    updated = replaceOrThrow(updated, 'aria-label="Previous"', 'aria-label="Anterior"', '@fleetbase/ember-ui pagination previous aria');
    updated = replaceRegexOrThrow(updated, />\s*Previous\s*</, '>Anterior<', '@fleetbase/ember-ui pagination previous');
    updated = replaceOrThrow(updated, 'aria-label="Next"', 'aria-label="Pr\u00f3ximo"', '@fleetbase/ember-ui pagination next aria');
    updated = replaceRegexOrThrow(updated, />\s*Next\s*</, '>Pr\u00f3ximo<', '@fleetbase/ember-ui pagination next');
    updated = replaceRegexOrThrow(updated, /\n\s*Showing\s*\n/, '\n                Mostrando\n', '@fleetbase/ember-ui pagination showing');
    updated = replaceRegexOrThrow(updated, /\n\s*to\s*\n/, '\n                at\u00e9\n', '@fleetbase/ember-ui pagination to');
    updated = replaceRegexOrThrow(updated, /\n\s*of\s*\n/, '\n                de\n', '@fleetbase/ember-ui pagination of');
    updated = replaceRegexOrThrow(updated, /\n\s*results\s*\n/, '\n                resultados\n', '@fleetbase/ember-ui pagination results');
    return updated;
});

patchPackageFile('@fleetbase/dev-engine', path.join('addon', 'extension.js'), (content) => {
    let updated = content;
    updated = replaceOrThrow(updated, "registerHeaderMenuItem('Developers'", "registerHeaderMenuItem('Desenvolvedores'", '@fleetbase/dev-engine title');
    updated = replaceOrThrow(updated, "description: 'API keys, webhooks, socket channels, event logs, and developer tooling.'", "description: 'Chaves de API, webhooks, canais socket, logs de eventos e ferramentas de integração.'", '@fleetbase/dev-engine description');
    updated = replaceOrThrow(updated, "title: 'API Keys'", "title: 'Chaves de API'", '@fleetbase/dev-engine shortcuts api keys');
    updated = replaceOrThrow(updated, "description: 'Create and manage API keys for authenticating your integrations.'", "description: 'Crie e gerencie chaves de API para autenticar integrações.'", '@fleetbase/dev-engine shortcuts api keys description');
    updated = replaceOrThrow(updated, "title: 'Events'", "title: 'Eventos'", '@fleetbase/dev-engine shortcuts events');
    updated = replaceOrThrow(updated, "description: 'Browse the full history of platform events and payloads.'", "description: 'Consulte o histórico completo de eventos e payloads da plataforma.'", '@fleetbase/dev-engine shortcuts events description');
    updated = replaceOrThrow(updated, "description: 'Configure webhook endpoints to receive real-time event notifications.'", "description: 'Configure endpoints de webhook para receber eventos em tempo real.'", '@fleetbase/dev-engine shortcuts webhooks description');
    updated = replaceOrThrow(updated, "description: 'Monitor active WebSocket channels and connected clients.'", "description: 'Monitore canais WebSocket ativos e clientes conectados.'", '@fleetbase/dev-engine shortcuts sockets description');
    updated = replaceOrThrow(updated, "description: 'Inspect API request and response logs for debugging.'", "description: 'Inspecione logs de requisição e resposta da API para depuração.'", '@fleetbase/dev-engine shortcuts logs description');
    return updated;
});

patchPackageFile('@fleetbase/iam-engine', path.join('addon', 'extension.js'), (content) => {
    let updated = content;
    updated = replaceOrThrow(updated, "description: 'Identity and access management: users, roles, policies, and permissions.'", "description: 'Gestão de identidade e acesso: usuários, papéis, políticas e permissões.'", '@fleetbase/iam-engine description');
    updated = replaceOrThrow(updated, "title: 'Users'", "title: 'Usuários'", '@fleetbase/iam-engine users');
    updated = replaceOrThrow(updated, "description: 'Manage console user accounts and their access levels.'", "description: 'Gerencie usuários do console e seus níveis de acesso.'", '@fleetbase/iam-engine users description');
    updated = replaceOrThrow(updated, "title: 'Drivers'", "title: 'Motoristas'", '@fleetbase/iam-engine drivers');
    updated = replaceOrThrow(updated, "description: 'View and manage driver accounts linked to your organisation.'", "description: 'Visualize e gerencie contas de motoristas vinculadas à organização.'", '@fleetbase/iam-engine drivers description');
    updated = replaceOrThrow(updated, "title: 'Customers'", "title: 'Clientes'", '@fleetbase/iam-engine customers');
    updated = replaceOrThrow(updated, "description: 'View and manage customer accounts linked to your organisation.'", "description: 'Visualize e gerencie contas de clientes vinculadas à organização.'", '@fleetbase/iam-engine customers description');
    updated = replaceOrThrow(updated, "title: 'Groups'", "title: 'Grupos'", '@fleetbase/iam-engine groups');
    updated = replaceOrThrow(updated, "description: 'Organise users into groups for bulk permission management.'", "description: 'Organize usuários em grupos para gestão de permissões em massa.'", '@fleetbase/iam-engine groups description');
    updated = replaceOrThrow(updated, "title: 'Roles'", "title: 'Papéis'", '@fleetbase/iam-engine roles');
    updated = replaceOrThrow(updated, "description: 'Define named roles that bundle sets of permissions.'", "description: 'Defina papéis nomeados que agrupam conjuntos de permissões.'", '@fleetbase/iam-engine roles description');
    updated = replaceOrThrow(updated, "title: 'Policies'", "title: 'Políticas'", '@fleetbase/iam-engine policies');
    updated = replaceOrThrow(updated, "description: 'Create fine-grained access control policies for resources.'", "description: 'Crie políticas de controle de acesso detalhadas para recursos.'", '@fleetbase/iam-engine policies description');
    return updated;
});

patchPackageFile('@fleetbase/ledger-engine', path.join('addon', 'extension.js'), (content) => {
    let updated = content;
    updated = replaceOrThrow(updated, "registerHeaderMenuItem('Ledger'", "registerHeaderMenuItem('Financeiro'", '@fleetbase/ledger-engine title');
    updated = replaceOrThrow(updated, "description: 'Invoicing, payments, accounting, and real-time financial reporting.'", "description: 'Faturamento, pagamentos, contabilidade e relatórios financeiros em tempo real.'", '@fleetbase/ledger-engine description');
    updated = replaceOrThrow(updated, "title: 'Invoices'", "title: 'Faturas'", '@fleetbase/ledger-engine invoices');
    updated = replaceOrThrow(updated, "description: 'Create, send, and manage customer invoices.'", "description: 'Crie, envie e gerencie faturas de clientes.'", '@fleetbase/ledger-engine invoices description');
    updated = replaceOrThrow(updated, "title: 'Wallets'", "title: 'Carteiras'", '@fleetbase/ledger-engine wallets');
    updated = replaceOrThrow(updated, "description: 'Manage driver, customer, and company wallets and balances.'", "description: 'Gerencie carteiras e saldos de motoristas, clientes e empresa.'", '@fleetbase/ledger-engine wallets description');
    updated = replaceOrThrow(updated, "title: 'Transactions'", "title: 'Transações'", '@fleetbase/ledger-engine transactions');
    updated = replaceOrThrow(updated, "description: 'A chronological record of every transaction.'", "description: 'Registro cronológico de todas as transações.'", '@fleetbase/ledger-engine transactions description');
    updated = replaceOrThrow(updated, "title: 'Payment Gateways'", "title: 'Gateways de pagamento'", '@fleetbase/ledger-engine gateways');
    updated = replaceOrThrow(updated, "description: 'Configure and manage payment gateway integrations.'", "description: 'Configure e gerencie integrações com gateways de pagamento.'", '@fleetbase/ledger-engine gateways description');
    updated = replaceOrThrow(updated, "title: 'Chart of Accounts'", "title: 'Plano de contas'", '@fleetbase/ledger-engine chart');
    updated = replaceOrThrow(updated, "description: 'View and manage the full chart of accounts.'", "description: 'Visualize e gerencie o plano completo de contas.'", '@fleetbase/ledger-engine chart description');
    updated = replaceOrThrow(updated, "title: 'Journal Entries'", "title: 'Lançamentos'", '@fleetbase/ledger-engine journal');
    updated = replaceOrThrow(updated, "description: 'Browse and create double-entry journal entries.'", "description: 'Consulte e crie lançamentos contábeis em partidas dobradas.'", '@fleetbase/ledger-engine journal description');
    updated = replaceOrThrow(updated, "title: 'General Ledger'", "title: 'Livro razão'", '@fleetbase/ledger-engine general ledger');
    updated = replaceOrThrow(updated, "description: 'Review all posted transactions across every account.'", "description: 'Revise todas as transações lançadas em cada conta.'", '@fleetbase/ledger-engine general ledger description');
    return updated;
});

patchPackageFile('@fleetbase/registry-bridge-engine', path.join('addon', 'extension.js'), (content) => {
    let updated = content;
    updated = replaceOrThrow(updated, "registerHeaderMenuItem('Extensions'", "registerHeaderMenuItem('Extensões'", '@fleetbase/registry-bridge-engine title');
    updated = replaceOrThrow(updated, "description: 'Discover, install, and publish extensions to the Fleetbase extension registry.'", "description: 'Descubra, instale e publique extensões no registro local do console.'", '@fleetbase/registry-bridge-engine description');
    updated = replaceOrThrow(updated, "title: 'Explore'", "title: 'Explorar'", '@fleetbase/registry-bridge-engine explore');
    updated = replaceOrThrow(updated, "description: 'Browse and discover extensions available in the registry.'", "description: 'Navegue e descubra extensões disponíveis no registro.'", '@fleetbase/registry-bridge-engine explore description');
    updated = replaceOrThrow(updated, "title: 'Installed'", "title: 'Instaladas'", '@fleetbase/registry-bridge-engine installed');
    updated = replaceOrThrow(updated, "description: 'View and manage extensions currently installed in your console.'", "description: 'Visualize e gerencie extensões instaladas no console.'", '@fleetbase/registry-bridge-engine installed description');
    updated = replaceOrThrow(updated, "title: 'Purchased'", "title: 'Adquiridas'", '@fleetbase/registry-bridge-engine purchased');
    updated = replaceOrThrow(updated, "description: 'Access extensions you have purchased from the registry.'", "description: 'Acesse extensões adquiridas no registro.'", '@fleetbase/registry-bridge-engine purchased description');
    updated = replaceOrThrow(updated, "'Extensions Registry'", "'Registro de extensões'", '@fleetbase/registry-bridge-engine admin panel');
    updated = replaceOrThrow(updated, "title: 'Registry Config'", "title: 'Configuração do registro'", '@fleetbase/registry-bridge-engine registry config');
    updated = replaceOrThrow(updated, "title: 'Awaiting Review'", "title: 'Aguardando revisão'", '@fleetbase/registry-bridge-engine awaiting review');
    updated = replaceOrThrow(updated, "title: 'Pending Publish'", "title: 'Publicação pendente'", '@fleetbase/registry-bridge-engine pending publish');
    return updated;
});

patchPackageFile('@fleetbase/ember-ui', path.join('addon', 'components', 'layout', 'header', 'smart-nav-menu', 'dropdown.hbs'), (content) => {
    let updated = content;
    updated = replaceOrThrow(updated, 'aria-label="More extensions"', 'aria-label="Mais módulos"', '@fleetbase/ember-ui dropdown aria');
    updated = replaceOrThrow(updated, '<span class="snm-dropdown-title">Extensions</span>', '<span class="snm-dropdown-title">Módulos</span>', '@fleetbase/ember-ui dropdown title');
    updated = replaceOrThrow(updated, 'aria-label="Close"', 'aria-label="Fechar"', '@fleetbase/ember-ui dropdown close');
    updated = replaceOrThrow(updated, 'placeholder="Search extensions..."', 'placeholder="Buscar módulos..."', '@fleetbase/ember-ui dropdown placeholder');
    updated = replaceOrThrow(updated, 'aria-label="Search extensions"', 'aria-label="Buscar módulos"', '@fleetbase/ember-ui dropdown search aria');
    updated = replaceOrThrow(updated, 'aria-label="Clear search"', 'aria-label="Limpar busca"', '@fleetbase/ember-ui dropdown clear aria');
    updated = replaceOrThrow(updated, '<div class="snm-dropdown-grid" aria-label="Extension list">', '<div class="snm-dropdown-grid" aria-label="Lista de módulos">', '@fleetbase/ember-ui dropdown grid aria');
    updated = replaceOrThrow(updated, 'No extensions match', 'Nenhum módulo corresponde a', '@fleetbase/ember-ui dropdown empty');
    updated = replaceOrThrow(updated, 'aria-label="from {{item._parentTitle}}"', 'aria-label="de {{item._parentTitle}}"', '@fleetbase/ember-ui dropdown parent aria');
    updated = replaceOrThrow(updated, '<p class="snm-dropdown-card-description snm-dropdown-card-description--from"><em>from {{item._parentTitle}}</em></p>', '<p class="snm-dropdown-card-description snm-dropdown-card-description--from"><em>de {{item._parentTitle}}</em></p>', '@fleetbase/ember-ui dropdown parent description');
    updated = replaceOrThrow(updated, 'title="Pin to navigation bar"', 'title="Fixar na barra de navegação"', '@fleetbase/ember-ui dropdown pin title');
    updated = replaceOrThrow(updated, 'aria-label="Pin {{item.title}} to navigation bar"', 'aria-label="Fixar {{item.title}} na barra de navegação"', '@fleetbase/ember-ui dropdown pin aria');
    updated = replaceOrThrow(updated, 'Customise navigation', 'Personalizar navegação', '@fleetbase/ember-ui dropdown customize');
    return updated;
});
