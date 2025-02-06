import { ConfigurationError } from "./errors/ConfigurationError";
import { GeneratorConfig } from "./GeneratorConfig";

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: GeneratorConfig = {
  indentation: 2,
  lineEnding: "LF",
  quoteMark: "double",
};

/**
 * Validates and merges user config with default config
 * @throws {ConfigurationError} if configuration is invalid
 */
export function createConfig(
  userConfig: Partial<GeneratorConfig> = {}
): GeneratorConfig {
  const config = { ...DEFAULT_CONFIG, ...userConfig };

  // Validate indentation
  if (config.indentation < 0) {
    throw new ConfigurationError("Indentation must be a non-negative number");
  }

  // Validate line ending
  if (!["LF", "CRLF"].includes(config.lineEnding)) {
    throw new ConfigurationError('Line ending must be either "LF" or "CRLF"');
  }

  // Validate quote mark
  if (!["single", "double"].includes(config.quoteMark)) {
    throw new ConfigurationError(
      'Quote mark must be either "single" or "double"'
    );
  }

  return config;
}
