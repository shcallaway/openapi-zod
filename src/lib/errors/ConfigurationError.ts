import { OpenApiGeneratorError } from "./OpenApiGeneratorError";

/**
 * Error thrown when there are configuration issues
 */
export class ConfigurationError extends OpenApiGeneratorError {
  constructor(message: string) {
    super(message, "CONFIGURATION_ERROR");
    this.name = "ConfigurationError";
  }
}
