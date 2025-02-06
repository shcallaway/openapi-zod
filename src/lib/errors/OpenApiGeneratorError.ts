/**
 * Base error class for OpenAPI generator errors
 */
export class OpenApiGeneratorError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "OpenApiGeneratorError";
  }
}
