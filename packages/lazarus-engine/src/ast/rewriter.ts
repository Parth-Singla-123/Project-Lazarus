import { Node, Project, SourceFile, SyntaxKind } from "ts-morph";
import { promises as fs } from "fs";
import path from "path";

/**
 * CodeRewriter - Uses ts-morph to rewrite selectors in source code
 */
export class CodeRewriter {
  private project: Project;

  constructor() {
    this.project = new Project({
      tsConfigFilePath: path.resolve(process.cwd(), "tsconfig.json"),
      skipAddingFilesFromTsConfig: true,
    });
  }

  /**
   * Find and replace a selector string in source code at a specific line
   */
  async replaceSelector(
    filePath: string,
    lineNumber: number,
    oldSelector: string,
    newSelector: string
  ): Promise<void> {
    try {

      try {
        await fs.access(filePath);
      } catch {
        throw new Error(`Invalid file path provided to AST: ${filePath}`);
      } 
      // Add file to project if not already added
      let sourceFile = this.project.getSourceFile(filePath);
      
      if (!sourceFile) {
        const fileContent = await fs.readFile(filePath, "utf-8");
        sourceFile = this.project.createSourceFile(filePath, fileContent, { overwrite: true });
      }

      // Find the best matching string literal and replace the selector.
      let replaced = false;
      let bestCandidateNode: Node | undefined;
      let bestCandidateDistance = Number.POSITIVE_INFINITY;

      sourceFile.forEachDescendant((node) => {
        if (replaced) return;

        // Check if this is a string literal matching the old selector
        if (node.getKind() === SyntaxKind.StringLiteral) {
          const nodeText = node.getText();
          if (!nodeText.includes(oldSelector)) {
            return;
          }

          const nodeLine = node.getStartLineNumber();
          const exactLineMatch = nodeLine === lineNumber;
          const distance = Math.abs(nodeLine - lineNumber);

          if (exactLineMatch) {
            const newText = nodeText.replace(oldSelector, newSelector);
            node.replaceWithText(newText);
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
        const node = bestCandidateNode;
        const nodeText = node.getText();
        const newText = nodeText.replace(oldSelector, newSelector);
        node.replaceWithText(newText);
        replaced = true;
        console.warn(
          `[Lazarus AST] Used nearest selector match at line ${node.getStartLineNumber()} instead of ${lineNumber}`
        );
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
}
