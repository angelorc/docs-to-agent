# docs-to-agent

Download docs from any GitHub repo and generate a compact index for AI coding agents.

Inspired by the Next.js team's `agents-md` approach ([PR #88961](https://github.com/vercel/next.js/pull/88961)) which scored 100% on agent evals vs 79% for skill-based approaches.

- **PR**: [vercel/next.js#88961](https://github.com/vercel/next.js/pull/88961) - the original implementation
- **Article**: [`AGENTS.md` outperforms skills in our agent evals](https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals) - explains the eval methodology and why retrieval beats pre-training

**This tool extracts that approach into a standalone CLI that works with any GitHub repo's docs** - not just Next.js.

## Usage

```bash
npx docs-to-agent https://github.com/nuxt/nuxt/tree/main/docs
```

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

## Development

```bash
pnpm install
pnpm run build       # obuild
pnpm run lint        # oxlint + oxfmt --check
pnpm run test        # vitest
pnpm run typecheck   # tsc --noEmit
```

## License

MIT
