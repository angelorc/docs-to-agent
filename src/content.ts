import type { DocFile, DocSection, IndexData } from "./types.ts";

export function buildDocTree(files: DocFile[]): DocSection[] {
  const sectionMap = new Map<string, { files: string[]; children: Map<string, DocFile[]> }>();

  for (const file of files) {
    const parts = file.relativePath.split("/");

    if (parts.length < 2) continue;

    const topDir = parts[0];
    if (!sectionMap.has(topDir)) {
      sectionMap.set(topDir, { files: [], children: new Map() });
    }
    const section = sectionMap.get(topDir)!;

    if (parts.length === 2) {
      section.files.push(parts[1]);
    } else {
      const subDir = parts.slice(1, -1).join("/");
      if (!section.children.has(subDir)) {
        section.children.set(subDir, []);
      }
      section.children.get(subDir)!.push(file);
    }
  }

  const sections: DocSection[] = [];
  for (const [name, data] of sectionMap) {
    const subsections: DocSection[] = [];
    for (const [subName, subFiles] of data.children) {
      subsections.push({
        name: subName,
        files: subFiles.map((f) => {
          const parts = f.relativePath.split("/");
          return parts[parts.length - 1];
        }),
        subsections: [],
      });
    }
    subsections.sort((a, b) => a.name.localeCompare(b.name));

    sections.push({
      name,
      files: [...data.files].sort(),
      subsections,
    });
  }

  sections.sort((a, b) => a.name.localeCompare(b.name));
  return sections;
}

export function generateIndex(data: IndexData): string {
  const parts: string[] = [];

  parts.push(
    `[${data.name} Docs Index]|root: ./${data.docsDir}|IMPORTANT: Prefer retrieval-led reasoning over pre-training-led reasoning for any ${data.name} tasks.`,
  );

  for (const section of data.sections) {
    const sectionPrefix = section.name;

    if (section.files.length > 0) {
      parts.push(`${sectionPrefix}:{${section.files.join(",")}}`);
    }

    for (const sub of section.subsections) {
      const subPrefix = `${sectionPrefix}/${sub.name}`;
      if (sub.files.length > 0) {
        parts.push(`${subPrefix}:{${sub.files.join(",")}}`);
      }
    }
  }

  return parts.join("|");
}

function markerStart(key: string): string {
  return `<!-- DOCS-TO-AGENT:${key}-START -->`;
}

function markerEnd(key: string): string {
  return `<!-- DOCS-TO-AGENT:${key}-END -->`;
}

export function injectIntoFile(content: string, indexContent: string, key: string): string {
  const start = markerStart(key);
  const end = markerEnd(key);
  const block = `${start}\n${indexContent}\n${end}`;

  const startIdx = content.indexOf(start);
  const endIdx = content.indexOf(end);

  if (startIdx !== -1 && endIdx !== -1) {
    return content.slice(0, startIdx) + block + content.slice(endIdx + end.length);
  }

  if (content.length > 0 && !content.endsWith("\n")) {
    return content + "\n\n" + block + "\n";
  }
  if (content.length > 0) {
    return content + "\n" + block + "\n";
  }
  return block + "\n";
}
