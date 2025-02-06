import { GeneratorConfig } from "./GeneratorConfig";

/**
 * Formats code according to configuration
 */
function formatCode(code: string, config: GeneratorConfig): string {
  // Replace line endings
  const formattedCode = code.replace(
    /\r?\n/g,
    config.lineEnding === "CRLF" ? "\r\n" : "\n"
  );

  // // Replace quotes
  // const quoteChar = config.quoteMark === "single" ? "'" : '"';
  // return formattedCode.replace(/["']/g, quoteChar);
  return formattedCode;
}

/**
 * Formats indentation according to configuration
 */
function formatIndentation(code: string, config: GeneratorConfig): string {
  const lines = code.split(/\r?\n/);
  const indentStr = " ".repeat(config.indentation);

  return lines
    .map((line) => {
      // Count leading spaces to determine indentation level
      const match = line.match(/^[ \t]*/);
      const indentLevel = match ? Math.floor(match[0].length / 2) : 0;

      // Replace existing indentation with configured indentation
      return line.replace(/^[ \t]*/, indentStr.repeat(indentLevel));
    })
    .join(config.lineEnding === "CRLF" ? "\r\n" : "\n");
}

/**
 * Formats imports according to configuration
 */
function formatImports(code: string, config: GeneratorConfig): string {
  const lines = code.split(/\r?\n/);
  const imports: string[] = [];
  const rest: string[] = [];

  // Separate imports from rest of the code
  lines.forEach((line) => {
    if (line.trim().startsWith("import ")) {
      imports.push(line);
    } else {
      rest.push(line);
    }
  });

  // Sort imports
  imports.sort();

  return [...imports, "", ...rest].join(
    config.lineEnding === "CRLF" ? "\r\n" : "\n"
  );
}

/**
 * Formats template code with all available formatters
 */
export function formatTemplate(code: string, config: GeneratorConfig): string {
  return formatImports(
    formatIndentation(formatCode(code.trim(), config), config),
    config
  );
}
