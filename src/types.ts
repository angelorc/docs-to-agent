export interface GitHubUrl {
  owner: string;
  repo: string;
  branch: string;
  docsPath: string;
}

export interface DocFile {
  relativePath: string;
}

export interface DocSection {
  name: string;
  files: string[];
  subsections: DocSection[];
}

export interface PullDocsOptions {
  owner: string;
  repo: string;
  branch: string;
  docsPath: string;
  cwd: string;
}

export interface PullDocsResult {
  localDocsDir: string;
  fileCount: number;
}

export interface IndexData {
  name: string;
  docsDir: string;
  sections: DocSection[];
}
