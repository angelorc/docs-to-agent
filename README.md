# docs-to-agent

<!-- automd:badges license color=yellow -->

[![npm version](https://img.shields.io/npm/v/docs-to-agent?color=yellow)](https://npmjs.com/package/docs-to-agent)
[![npm downloads](https://img.shields.io/npm/dm/docs-to-agent?color=yellow)](https://npm.chart.dev/docs-to-agent)
[![license](https://img.shields.io/github/license/angelorc/docs-to-agent?color=yellow)](https://github.com/angelorc/docs-to-agent/blob/main/LICENSE)

<!-- /automd -->

Download docs from any GitHub repo and generate a compact index for AI coding agents.

Inspired by the Next.js team's `agents-md` approach ([PR #88961](https://github.com/vercel/next.js/pull/88961)) which scored 100% on agent evals vs 79% for skill-based approaches.

- **PR**: [vercel/next.js#88961](https://github.com/vercel/next.js/pull/88961) - the original implementation
- **Article**: [`AGENTS.md` outperforms skills in our agent evals](https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals) - explains the eval methodology and why retrieval beats pre-training

**This tool extracts that approach into a standalone CLI that works with any GitHub repo's docs** - not just Next.js.

## Usage

<!-- automd:pm-x args="https://github.com/nuxt/nuxt/tree/main/docs" -->

```sh
# npm
npx docs-to-agent https://github.com/nuxt/nuxt/tree/main/docs

# pnpm
pnpm dlx docs-to-agent https://github.com/nuxt/nuxt/tree/main/docs

# bun
bunx docs-to-agent https://github.com/nuxt/nuxt/tree/main/docs

# deno
deno run -A npm:docs-to-agent https://github.com/nuxt/nuxt/tree/main/docs
```

<!-- /automd -->

This will:

1. Sparse-checkout only the docs folder
2. Store it under `.docs-to-agent/nuxt-nuxt/`
3. Generate a compact index in `AGENTS.md`
4. Add `.docs-to-agent/` to `.gitignore`

### Multiple repos

Run it multiple times — each repo gets its own namespaced folder and keyed block in `AGENTS.md`:

```bash
npx docs-to-agent https://github.com/nuxt/nuxt/tree/main/docs
npx docs-to-agent https://github.com/drizzle-team/drizzle-orm/tree/main/docs
npx docs-to-agent https://github.com/shadcn-ui/ui/tree/main/apps/v4/content/docs
```

```
.docs-to-agent/
├── nuxt-nuxt/
├── drizzle-team-drizzle-orm/
└── shadcn-ui-ui/
```

### Options

```
-o, --output <file>   Target file (default: AGENTS.md)
--name <name>         Project name override (default: repo name)
```

## Install

<!-- automd:pm-install -->

```sh
# ✨ Auto-detect
npx nypm install docs-to-agent

# npm
npm install docs-to-agent

# yarn
yarn add docs-to-agent

# pnpm
pnpm add docs-to-agent

# bun
bun install docs-to-agent

# deno
deno install npm:docs-to-agent
```

<!-- /automd -->

## Programmatic Usage

<!-- automd:jsimport src="./src/index.ts" -->

**ESM** (Node.js, Bun, Deno)

```js
import {
  DOCS_BASE_DIR,
  cloneDocsFolder,
  collectDocFiles,
  ensureGitignoreEntry,
  parseGitHubUrl,
  pullDocs,
  repoKey,
  buildDocTree,
  generateIndex,
  injectIntoFile,
} from "docs-to-agent";
```

<!-- /automd -->

## Development

```bash
pnpm install
pnpm run build       # obuild
pnpm run lint        # oxlint + oxfmt --check
pnpm run test        # vitest
pnpm run typecheck   # tsc --noEmit
```

## License

<!-- automd:contributors license=MIT author="angelorc" -->

Published under the [MIT](https://github.com/angelorc/docs-to-agent/blob/main/LICENSE) license.
Made by [@angelorc](https://github.com/angelorc) and [community](https://github.com/angelorc/docs-to-agent/graphs/contributors) 💛
<br><br>
<a href="https://github.com/angelorc/docs-to-agent/graphs/contributors">
<img src="https://contrib.rocks/image?repo=angelorc/docs-to-agent" />
</a>

<!-- /automd -->

<!-- automd:with-automd -->

---

_🤖 auto updated with [automd](https://automd.unjs.io)_

<!-- /automd -->
