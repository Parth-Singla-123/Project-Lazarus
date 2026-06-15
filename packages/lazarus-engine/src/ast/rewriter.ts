import { Node, Project, SourceFile, SyntaxKind } from "ts-morph";
import { promises as fs } from "fs";
import path from "path";

export class CodeRewriter {
  private project: Project;

  constructor() {
    this.project = new Project({
      tsConfigFilePath: path.resolve(process.cwd(), "tsconfig.json"),
      skipAddingFilesFromTsConfig: true,
    });
  }

  async replaceSelector(
    filePath: string,
    lineNumber: number,
    oldSelector: string,
    newTargetSelector: string
  ): Promise<void> {
    try {
      const sourceFile = await this.loadSourceFile(filePath);
      let replaced = false;
      let bestCandidateNode: Node | undefined;
      let bestCandidateDistance = Number.POSITIVE_INFINITY;

      sourceFile.forEachDescendant((node) => {
        if (replaced) return;
        if (node.getKind() === SyntaxKind.StringLiteral) {
          const nodeText = node.getText();
          if (!nodeText.includes(oldSelector)) return;

          const nodeLine = node.getStartLineNumber();
          const exactLineMatch = nodeLine === lineNumber;
          const distance = Math.abs(nodeLine - lineNumber);

          if (exactLineMatch) {
            node.replaceWithText(nodeText.replace(oldSelector, newTargetSelector));
            replaced = true;
            return;
          }

          if (distance < bestCandidateDistance) {
            bestCandidateNode = node;
            bestCandidateDistance = distance;
          }
        }
      });

      if (!replaced && bestCandidateNode) {
        bestCandidateNode.replaceWithText(bestCandidateNode.getText().replace(oldSelector, newTargetSelector));
        replaced = true;
        console.warn(`[Lazarus AST] Used nearest selector match at line ${bestCandidateNode.getStartLineNumber()}`);
      }

      if (replaced) {
        await sourceFile.save();
        console.log(`[Lazarus AST] Replaced selector in ${filePath}:${lineNumber}`);
      } else {
        console.warn(`[Lazarus AST] Could not find selector to replace in ${filePath}:${lineNumber}`);
      }
    } catch (error) {
      console.error("[Lazarus AST] Error rewriting code:", error);
      throw error;
    }
  }

  private async loadSourceFile(filePath: string): Promise<SourceFile> {
    try { await fs.access(filePath); } catch { throw new Error(`Invalid file path: ${filePath}`); }
    let sourceFile = this.project.getSourceFile(filePath);
    if (!sourceFile) {
      const fileContent = await fs.readFile(filePath, "utf-8");
      sourceFile = this.project.createSourceFile(filePath, fileContent, { overwrite: true });
    }
    return sourceFile;
  }
}