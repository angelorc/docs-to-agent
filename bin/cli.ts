#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { Command } from "commander";
import pc from "picocolors";
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

const program = new Command();

program
  .name("docs-to-agent")
  .description("Download docs from a GitHub repo and generate a compact index for AI coding agents")
  .argument(
    "<github-url>",
    "GitHub URL with docs path (e.g. https://github.com/nuxt/nuxt/tree/main/docs)",
  )
  .option("-o, --output <file>", "Target file", "AGENTS.md")
  .option("--name <name>", "Project name override (defaults to repo name)")
  .action(async (url: string, opts: { output: string; name?: string }) => {
    try {
      console.log(pc.cyan("Parsing GitHub URL..."));
      const parsed = parseGitHubUrl(url);
      const projectName = opts.name || parsed.repo;
      const key = repoKey(parsed.owner, parsed.repo);
      console.log(
        pc.dim(
          `  repo: ${parsed.owner}/${parsed.repo}, branch: ${parsed.branch}, path: ${parsed.docsPath}`,
        ),
      );

      const cwd = process.cwd();
      console.log(pc.cyan("Downloading documentation..."));
      const result = pullDocs({
        owner: parsed.owner,
        repo: parsed.repo,
        branch: parsed.branch,
        docsPath: parsed.docsPath,
        cwd,
      });
      console.log(pc.green(`  Downloaded ${result.fileCount} doc files → ${result.localDocsDir}/`));

      const localDocsDir = join(cwd, result.localDocsDir);
      const files = collectDocFiles(localDocsDir);
      if (files.length === 0) {
        console.log(pc.yellow("No .md/.mdx files found in docs folder."));
        process.exit(1);
      }

      const sections = buildDocTree(files);

      const indexContent = generateIndex({
        name: projectName,
        docsDir: result.localDocsDir,
        sections,
      });

      const outputPath = resolve(cwd, opts.output);
      let existingContent = "";
      if (existsSync(outputPath)) {
        existingContent = readFileSync(outputPath, "utf-8");
      }
      const updatedContent = injectIntoFile(existingContent, indexContent, key);
      writeFileSync(outputPath, updatedContent);
      console.log(pc.green(`  Updated ${opts.output}`));

      const gitignoreResult = ensureGitignoreEntry(cwd, DOCS_BASE_DIR);
      if (gitignoreResult.updated) {
        console.log(pc.dim(`  Added ${DOCS_BASE_DIR}/ to .gitignore`));
      }

      console.log();
      console.log(pc.green(pc.bold("Done!")));
      console.log(pc.dim(`  ${files.length} docs indexed → ${opts.output} [${key}]`));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(pc.red(`Error: ${msg}`));
      process.exit(1);
    }
  });

program.parse();
