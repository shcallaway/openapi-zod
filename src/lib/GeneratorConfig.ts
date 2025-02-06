/**
 * Configuration options for code generation
 */
export interface GeneratorConfig {
  /** Number of spaces for indentation */
  indentation: number;
  /** Line ending style */
  lineEnding: "LF" | "CRLF";
  /** Quote style for strings */
  quoteMark: "single" | "double";

  // Future ideas for config options
  //   /** Whether to run prettier on generated code */
  //   prettier: boolean;
  //   /** Whether to use strict type checking */
  //   strict: boolean;
}
