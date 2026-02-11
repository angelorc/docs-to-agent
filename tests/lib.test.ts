import { describe, expect, it } from "vitest";
import {
  buildDocTree,
  generateIndex,
  injectIntoFile,
  parseGitHubUrl,
  repoKey,
  type DocFile,
} from "../src/index.ts";

describe("parseGitHubUrl", () => {
  it("parses a standard GitHub tree URL", () => {
    const result = parseGitHubUrl("https://github.com/nuxt/nuxt/tree/main/docs");
    expect(result).toEqual({
      owner: "nuxt",
      repo: "nuxt",
      branch: "main",
      docsPath: "docs",
    });
  });

  it("parses a URL with nested docs path", () => {
    const result = parseGitHubUrl("https://github.com/owner/repo/tree/develop/packages/core/docs");
    expect(result).toEqual({
      owner: "owner",
      repo: "repo",
      branch: "develop",
      docsPath: "packages/core/docs",
    });
  });

  it("parses shadcn deep nested URL", () => {
    const result = parseGitHubUrl("https://github.com/shadcn-ui/ui/tree/main/apps/v4/content/docs");
    expect(result).toEqual({
      owner: "shadcn-ui",
      repo: "ui",
      branch: "main",
      docsPath: "apps/v4/content/docs",
    });
  });

  it("parses a URL with trailing slash", () => {
    const result = parseGitHubUrl("https://github.com/nuxt/nuxt/tree/main/docs/");
    expect(result).toEqual({
      owner: "nuxt",
      repo: "nuxt",
      branch: "main",
      docsPath: "docs",
    });
  });

  it("throws for a repo URL without docs path", () => {
    expect(() => parseGitHubUrl("https://github.com/nuxt/nuxt")).toThrow(
      "URL must include a docs path",
    );
  });

  it("throws for a repo URL with .git suffix", () => {
    expect(() => parseGitHubUrl("https://github.com/nuxt/nuxt.git")).toThrow(
      "URL must include a docs path",
    );
  });

  it("throws for an invalid URL", () => {
    expect(() => parseGitHubUrl("not-a-url")).toThrow("Invalid GitHub URL");
  });
});

describe("repoKey", () => {
  it("produces owner-repo key", () => {
    expect(repoKey("nuxt", "nuxt")).toBe("nuxt-nuxt");
    expect(repoKey("shadcn-ui", "ui")).toBe("shadcn-ui-ui");
  });
});

describe("injectIntoFile", () => {
  const key = "nuxt-nuxt";
  const index = "[nuxt Docs Index]|root: ./.docs-to-agent/nuxt-nuxt";

  it("appends to an empty file", () => {
    const result = injectIntoFile("", index, key);
    expect(result).toBe(
      `<!-- DOCS-TO-AGENT:nuxt-nuxt-START -->\n${index}\n<!-- DOCS-TO-AGENT:nuxt-nuxt-END -->\n`,
    );
  });

  it("appends to a file without markers", () => {
    const result = injectIntoFile("# My Project\n", index, key);
    expect(result).toContain("# My Project");
    expect(result).toContain("<!-- DOCS-TO-AGENT:nuxt-nuxt-START -->");
    expect(result).toContain(index);
    expect(result).toContain("<!-- DOCS-TO-AGENT:nuxt-nuxt-END -->");
  });

  it("replaces content between existing markers", () => {
    const existing =
      "# My Project\n\n<!-- DOCS-TO-AGENT:nuxt-nuxt-START -->\nold content\n<!-- DOCS-TO-AGENT:nuxt-nuxt-END -->\n";
    const result = injectIntoFile(existing, index, key);
    expect(result).toContain(index);
    expect(result).not.toContain("old content");
    expect(result.match(/DOCS-TO-AGENT:nuxt-nuxt-START/g)?.length).toBe(1);
    expect(result.match(/DOCS-TO-AGENT:nuxt-nuxt-END/g)?.length).toBe(1);
  });

  it("is idempotent", () => {
    const first = injectIntoFile("", index, key);
    const second = injectIntoFile(first, index, key);
    expect(second).toBe(first);
  });

  it("preserves content before and after markers", () => {
    const existing =
      "# Before\n\n<!-- DOCS-TO-AGENT:nuxt-nuxt-START -->\nold\n<!-- DOCS-TO-AGENT:nuxt-nuxt-END -->\n\n# After\n";
    const result = injectIntoFile(existing, index, key);
    expect(result).toContain("# Before");
    expect(result).toContain("# After");
    expect(result).toContain(index);
  });

  it("supports multiple repos in the same file", () => {
    const nuxtIndex = "[nuxt Docs Index]|root: ./.docs-to-agent/nuxt-nuxt";
    const nextIndex = "[next.js Docs Index]|root: ./.docs-to-agent/vercel-next.js";

    let content = injectIntoFile("", nuxtIndex, "nuxt-nuxt");
    content = injectIntoFile(content, nextIndex, "vercel-next.js");

    expect(content).toContain("DOCS-TO-AGENT:nuxt-nuxt-START");
    expect(content).toContain(nuxtIndex);
    expect(content).toContain("DOCS-TO-AGENT:vercel-next.js-START");
    expect(content).toContain(nextIndex);
  });

  it("updates only the targeted repo block", () => {
    const nuxtIndex = "[nuxt Docs Index]|root: ./.docs-to-agent/nuxt-nuxt";
    const nextIndex = "[next.js Docs Index]|root: ./.docs-to-agent/vercel-next.js";
    const nuxtUpdated = "[nuxt Docs Index UPDATED]|root: ./.docs-to-agent/nuxt-nuxt";

    let content = injectIntoFile("", nuxtIndex, "nuxt-nuxt");
    content = injectIntoFile(content, nextIndex, "vercel-next.js");
    content = injectIntoFile(content, nuxtUpdated, "nuxt-nuxt");

    expect(content).toContain(nuxtUpdated);
    expect(content).not.toContain("[nuxt Docs Index]|root");
    expect(content).toContain(nextIndex);
  });
});

describe("buildDocTree", () => {
  it("groups files by top-level directory", () => {
    const files: DocFile[] = [
      { relativePath: "getting-started/installation.md" },
      { relativePath: "getting-started/quick-start.md" },
      { relativePath: "api/overview.md" },
    ];
    const tree = buildDocTree(files);
    expect(tree).toHaveLength(2);
    expect(tree[0].name).toBe("api");
    expect(tree[1].name).toBe("getting-started");
  });

  it("creates nested subsections for deeper paths", () => {
    const files: DocFile[] = [
      { relativePath: "api/components/button.md" },
      { relativePath: "api/components/input.md" },
      { relativePath: "api/hooks/useEffect.md" },
    ];
    const tree = buildDocTree(files);
    expect(tree).toHaveLength(1);
    expect(tree[0].name).toBe("api");
    expect(tree[0].subsections).toHaveLength(2);
    expect(tree[0].subsections[0].name).toBe("components");
    expect(tree[0].subsections[0].files).toEqual(["button.md", "input.md"]);
    expect(tree[0].subsections[1].name).toBe("hooks");
    expect(tree[0].subsections[1].files).toEqual(["useEffect.md"]);
  });

  it("handles 4-level deep paths", () => {
    const files: DocFile[] = [{ relativePath: "guides/advanced/deployment/docker.md" }];
    const tree = buildDocTree(files);
    expect(tree).toHaveLength(1);
    expect(tree[0].name).toBe("guides");
    expect(tree[0].subsections[0].name).toBe("advanced/deployment");
    expect(tree[0].subsections[0].files).toEqual(["docker.md"]);
  });

  it("skips root-level files (no directory)", () => {
    const files: DocFile[] = [{ relativePath: "README.md" }, { relativePath: "api/overview.md" }];
    const tree = buildDocTree(files);
    expect(tree).toHaveLength(1);
    expect(tree[0].name).toBe("api");
  });

  it("sorts sections and files alphabetically", () => {
    const files: DocFile[] = [
      { relativePath: "zeta/zebra.md" },
      { relativePath: "alpha/beta.md" },
      { relativePath: "alpha/alpha.md" },
    ];
    const tree = buildDocTree(files);
    expect(tree[0].name).toBe("alpha");
    expect(tree[0].files).toEqual(["alpha.md", "beta.md"]);
    expect(tree[1].name).toBe("zeta");
  });
});

describe("generateIndex", () => {
  it("produces compact pipe-separated index", () => {
    const result = generateIndex({
      name: "Nuxt",
      docsDir: ".docs-to-agent/nuxt-nuxt",
      sections: [
        {
          name: "getting-started",
          files: ["installation.md", "quick-start.md"],
          subsections: [],
        },
        {
          name: "api",
          files: [],
          subsections: [{ name: "components", files: ["button.md"], subsections: [] }],
        },
      ],
    });

    expect(result).toContain("[Nuxt Docs Index]");
    expect(result).toContain("root: ./.docs-to-agent/nuxt-nuxt");
    expect(result).toContain(
      "IMPORTANT: Prefer retrieval-led reasoning over pre-training-led reasoning for any Nuxt tasks.",
    );
    expect(result).toContain("getting-started:{installation.md,quick-start.md}");
    expect(result).toContain("api/components:{button.md}");
  });
});
