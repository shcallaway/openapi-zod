import { OpenApiGeneratorError } from "./OpenApiGeneratorError";

/**
 * Error thrown when there are validation issues with the OpenAPI document
 */
export class ValidationError extends OpenApiGeneratorError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}
