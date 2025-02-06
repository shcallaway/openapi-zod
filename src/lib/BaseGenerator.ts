import { GeneratorConfig } from "./GeneratorConfig";
import { OpenApiDocument, OpenApiOperation } from "./types";

type PathCallback = (
  path: string,
  method: string,
  operation: OpenApiOperation
) => void;

/**
 * Base generator class with shared functionality for OpenAPI code generation
 */
export abstract class BaseGenerator {
  protected config: GeneratorConfig;

  constructor(config: GeneratorConfig) {
    this.config = config;
  }

  /**
   * Iterates over paths in an OpenAPI document
   * @param document - The OpenAPI document
   * @param callback - Callback function to execute for each path
   */
  protected iterateOverPaths(
    document: OpenApiDocument,
    callback: PathCallback
  ): void {
    if (!document.paths) return;

    for (const [path, pathItem] of Object.entries(document.paths)) {
      for (const [method, operation] of Object.entries(pathItem)) {
        callback(path, method, operation);
      }
    }
  }

  /**
   * Creates a normalized name from a path
   * @param method - HTTP method
   * @param path - URL path
   * @param suffix - Optional suffix to append to the name
   * @returns Normalized name
   */
  protected createNameFromPath(
    method: string,
    path: string,
    suffix: string = ""
  ): string {
    const pathParts = path.split("/").filter(Boolean);

    const normalizedPath = pathParts
      .map((part) => {
        // Remove brackets from path parameters
        const cleanPart = part.replace(/[{}]/g, "");
        // Split on underscores and capitalize each part
        return cleanPart
          .split("_")
          .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
          .join("");
      })
      .join("");

    return `${method.toLowerCase()}${normalizedPath}${suffix}`;
  }
}
