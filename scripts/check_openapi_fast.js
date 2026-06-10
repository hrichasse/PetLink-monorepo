const fs = require('fs');
const path = require('path');

const discoverMethods = (fileContent) => {
  const methods = new Set();
  const matches = fileContent.matchAll(/export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\b/g);

  for (const match of matches) {
    const method = match[1];
    if (method) {
      methods.add(method.toLowerCase());
    }
  }

  return Array.from(methods);
};

const collectRouteFiles = (dir) => {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectRouteFiles(entryPath));
      continue;
    }

    if (entry.isFile() && entry.name === "route.ts") {
      files.push(entryPath);
    }
  }

  return files;
};

const toOpenApiPath = (routeFilePath, apiDir, routeBasePath) => {
  const relative = path.relative(apiDir, routeFilePath);
  const withoutRouteFile = relative.replace(new RegExp(`\\${path.sep}?route\\.ts$`), "");
  const normalized = withoutRouteFile
    .split(path.sep)
    .filter(Boolean)
    .map((segment) => segment.replace(/^\[(.+)\]$/, "{$1}"));

  if (normalized.length === 0) {
    return routeBasePath;
  }

  return `${routeBasePath}/${normalized.join("/")}`;
};

const discoverRoutes = (apiDir, routeBasePath) => {
  return collectRouteFiles(apiDir)
    .map((filePath) => {
      const fileContent = fs.readFileSync(filePath, "utf8");
      return {
        routePath: toOpenApiPath(filePath, apiDir, routeBasePath),
        methods: discoverMethods(fileContent)
      };
    })
    .filter((route) => route.methods.length > 0)
    .sort((left, right) => left.routePath.localeCompare(right.routePath));
};

function checkApp(appName, overridesContent) {
  console.log(`\n=== Checking ${appName} ===`);
  const apiDir = path.join(__dirname, '..', 'apps', appName, 'src', 'app', 'api', 'v1');
  const routes = discoverRoutes(apiDir, '/api/v1');
  
  let missing = 0;
  for (const route of routes) {
    for (const method of route.methods) {
      const opKey = `${method.toUpperCase()} ${route.routePath}`;
      if (!overridesContent.includes(`"${opKey}"`)) {
        console.log(`Missing override for: ${opKey}`);
        missing++;
      }
    }
  }
  if (missing === 0) console.log("All operations covered!");
}

const marketplaceContent = fs.readFileSync(path.join(__dirname, '..', 'apps', 'marketplace', 'src', 'lib', 'openapi.ts'), 'utf8');
const petsContent = fs.readFileSync(path.join(__dirname, '..', 'apps', 'pets', 'src', 'lib', 'openapi.ts'), 'utf8');
const authContent = fs.readFileSync(path.join(__dirname, '..', 'apps', 'auth', 'src', 'lib', 'openapi.ts'), 'utf8');

checkApp('marketplace', marketplaceContent);
checkApp('pets', petsContent);
checkApp('auth', authContent);
