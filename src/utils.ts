import { execSync } from "node:child_process";
import {
  appendFileSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join, relative } from "node:path";
import type { DocFile, GitHubUrl, PullDocsOptions, PullDocsResult } from "./types.ts";

export const DOCS_BASE_DIR = ".docs-to-agent";

export function repoKey(owner: string, repo: string): string {
  return `${owner}-${repo}`;
}

export function parseGitHubUrl(url: string): GitHubUrl {
  const treeMatch = url.match(
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)\/(.+?)\/?\s*$/,
  );
  if (treeMatch) {
    return {
      owner: treeMatch[1],
      repo: treeMatch[2],
      branch: treeMatch[3],
      docsPath: treeMatch[4],
    };
  }

  const repoMatch = url.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+?)(\.git)?\/?$/);
  if (repoMatch) {
    throw new Error(
      `URL must include a docs path. Example: https://github.com/${repoMatch[1]}/${repoMatch[2]}/tree/main/docs`,
    );
  }

  throw new Error(
    "Invalid GitHub URL. Expected format: https://github.com/owner/repo/tree/branch/docs-path",
  );
}

function copyDirRecursive(src: string, dest: string): void {
  mkdirSync(dest, { recursive: true });
  const entries = readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

export function cloneDocsFolder(
  repoUrl: string,
  branch: string,
  docsPath: string,
  destDir: string,
): void {
  const tmpDir = destDir + "-tmp";

  if (existsSync(tmpDir)) {
    rmSync(tmpDir, { recursive: true, force: true });
  }
  mkdirSync(tmpDir, { recursive: true });

  try {
    execSync(`git clone --depth 1 --filter=blob:none --sparse --branch ${branch} ${repoUrl} .`, {
      cwd: tmpDir,
      stdio: "pipe",
    });
    execSync(`git sparse-checkout set ${docsPath}`, {
      cwd: tmpDir,
      stdio: "pipe",
    });

    const srcDir = join(tmpDir, docsPath);
    if (!existsSync(srcDir)) {
      throw new Error(`Docs path "${docsPath}" not found in repo. Check the URL path.`);
    }

    if (existsSync(destDir)) {
      rmSync(destDir, { recursive: true, force: true });
    }
    copyDirRecursive(srcDir, destDir);
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

export function pullDocs(options: PullDocsOptions): PullDocsResult {
  const repoUrl = `https://github.com/${options.owner}/${options.repo}.git`;
  const key = repoKey(options.owner, options.repo);
  const localDocsDir = join(options.cwd, DOCS_BASE_DIR, key);

  cloneDocsFolder(repoUrl, options.branch, options.docsPath, localDocsDir);

  const files = collectDocFiles(localDocsDir);

  return {
    localDocsDir: `${DOCS_BASE_DIR}/${key}`,
    fileCount: files.length,
  };
}

export function collectDocFiles(dir: string): DocFile[] {
  const files: DocFile[] = [];

  function walk(currentDir: string): void {
    if (!existsSync(currentDir)) return;
    const entries = readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (/\.(md|mdx)$/i.test(entry.name)) {
        if (/^index\.(md|mdx)$/i.test(entry.name)) continue;
        files.push({ relativePath: relative(dir, fullPath) });
      }
    }
  }

  walk(dir);
  return files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

export function ensureGitignoreEntry(
  cwd: string,
  dirName: string,
): { path: string; updated: boolean; alreadyPresent: boolean } {
  const gitignorePath = join(cwd, ".gitignore");
  const entry = `${dirName}/`;

  if (existsSync(gitignorePath)) {
    const content = readFileSync(gitignorePath, "utf-8");
    const lines = content.split("\n");
    if (lines.some((line) => line.trim() === entry || line.trim() === dirName)) {
      return { path: gitignorePath, updated: false, alreadyPresent: true };
    }
    const separator = content.endsWith("\n") ? "" : "\n";
    appendFileSync(gitignorePath, `${separator}${entry}\n`);
    return { path: gitignorePath, updated: true, alreadyPresent: false };
  }

  writeFileSync(gitignorePath, `${entry}\n`);
  return { path: gitignorePath, updated: true, alreadyPresent: false };
}
