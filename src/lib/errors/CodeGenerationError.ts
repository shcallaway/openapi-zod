import { OpenApiGeneratorError } from "./OpenApiGeneratorError";

/**
 * Error thrown when there are code generation issues
 */
export class CodeGenerationError extends OpenApiGeneratorError {
  constructor(message: string) {
    super(message, "CODE_GENERATION_ERROR");
    this.name = "CodeGenerationError";
  }
}
