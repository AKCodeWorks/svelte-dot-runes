import * as vscode from "vscode";

export async function activate(context: vscode.ExtensionContext) {
  console.log("Svelte Dot Runes Activated");

  vscode.workspace.onDidChangeTextDocument((e) => {
    getCursorText();
  });

  async function getCursorText() {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      try {
        const position = editor.selection?.active;
        if (!position) {
          return;
        }

        const lineText: string | undefined = editor.document.lineAt(
          position.line
        )?.text;
        if (!lineText) {
          return;
        }

        const isPatternPresent =
          /(props|state|inspect)\.(\w+(\.\w+)*)\s{2}$/i.test(lineText);
        if (!isPatternPresent) {
          return;
        } else {
          await editor
            .edit((editBuilder) => {
              const range = new vscode.Range(
                new vscode.Position(position.line, 0),
                new vscode.Position(position.line, lineText.length)
              );

              if (typeof lineText === "string") {
                // @ts-ignore
                editBuilder.replace(range, generateSnippet(lineText));
              }
            })
            .then(() => {
              return;
            });
        }
      } catch (error) {
        console.error("Error in getCursorText:", error);
      }
    }
  }
}

export function deactivate() {}

function generateSnippet(text: string | undefined): string | undefined {
  if (!text) {
    return undefined;
  }

  const trimmedText = text?.trim();
  const splitText = trimmedText.split(".");
  const keyword = splitText[0];
  const properties = splitText.slice(1);

  if (keyword === "props") {
    return `let { ${properties.join(", ")} } = $props();`;
  } else if (keyword === "state") {
    return properties.map((prop) => `let { ${prop} } = $state();`).join("\n");
  } else if (keyword === "inspect") {
    return `$inspect(${properties.join(", ")});`;
  }

  return undefined;
}
