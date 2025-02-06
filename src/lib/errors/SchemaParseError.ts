import { OpenApiGeneratorError } from "./OpenApiGeneratorError";

/**
 * Error thrown when there are schema parsing issues
 */
export class SchemaParseError extends OpenApiGeneratorError {
  constructor(message: string) {
    super(message, "SCHEMA_PARSE_ERROR");
    this.name = "SchemaParseError";
  }
}
