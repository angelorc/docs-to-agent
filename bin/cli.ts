#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { defineCommand, runMain } from "citty";
import { consola } from "consola";
import { colors } from "consola/utils";
import {
  DOCS_BASE_DIR,
  buildDocTree,
  collectDocFiles,
  ensureGitignoreEntry,
  generateIndex,
  injectIntoFile,
  parseGitHubUrl,
  pullDocs,
  repoKey,
} from "../src/index.ts";

const main = defineCommand({
  meta: {
    name: "docs-to-agent",
    version: "0.1.0",
    description:
      "Download docs from a GitHub repo and generate a compact index for AI coding agents",
  },
  args: {
    url: {
      type: "positional",
      description: "GitHub URL with docs path (e.g. https://github.com/nuxt/nuxt/tree/main/docs)",
      required: true,
    },
    output: {
      type: "string",
      description: "Target file",
      alias: "o",
      default: "AGENTS.md",
    },
    name: {
      type: "string",
      description: "Project name override (defaults to repo name)",
    },
  },
  run({ args }) {
    try {
      consola.start("Parsing GitHub URL...");
      const parsed = parseGitHubUrl(args.url);
      const projectName = args.name || parsed.repo;
      const key = repoKey(parsed.owner, parsed.repo);
      consola.info(
        colors.dim(
          `repo: ${parsed.owner}/${parsed.repo}, branch: ${parsed.branch}, path: ${parsed.docsPath}`,
        ),
      );

      const cwd = process.cwd();
      consola.start("Downloading documentation...");
      const result = pullDocs({
        owner: parsed.owner,
        repo: parsed.repo,
        branch: parsed.branch,
        docsPath: parsed.docsPath,
        cwd,
      });
      consola.success(`Downloaded ${result.fileCount} doc files → ${result.localDocsDir}/`);

      const localDocsDir = join(cwd, result.localDocsDir);
      const files = collectDocFiles(localDocsDir);
      if (files.length === 0) {
        consola.warn("No .md/.mdx files found in docs folder.");
        process.exit(1);
      }

      const sections = buildDocTree(files);

      const indexContent = generateIndex({
        name: projectName,
        docsDir: result.localDocsDir,
        sections,
      });

      const outputPath = resolve(cwd, args.output);
      let existingContent = "";
      if (existsSync(outputPath)) {
        existingContent = readFileSync(outputPath, "utf-8");
      }
      const updatedContent = injectIntoFile(existingContent, indexContent, key);
      writeFileSync(outputPath, updatedContent);
      consola.success(`Updated ${args.output}`);

      const gitignoreResult = ensureGitignoreEntry(cwd, DOCS_BASE_DIR);
      if (gitignoreResult.updated) {
        consola.info(colors.dim(`Added ${DOCS_BASE_DIR}/ to .gitignore`));
      }

      consola.box(`Done! ${files.length} docs indexed → ${args.output} [${key}]`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      consola.error(msg);
      process.exit(1);
    }
  },
});

runMain(main);
