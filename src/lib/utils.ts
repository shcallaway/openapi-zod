import * as fs from "fs";

/**
 * Utility class for naming and string manipulation
 */
export class StringUtils {
  /**
   * Capitalizes the first letter of a string
   * @param str - String to capitalize
   * @returns Capitalized string
   */
  static capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Creates a schema name from a method and path
   * @param method - HTTP method
   * @param path - URL path
   * @param suffix - Schema name suffix
   * @returns Schema name
   */
  static createSchemaName(
    method: string,
    path: string,
    suffix: "RequestBody" | "ResponseBody" | "PathParams" | "QueryParams"
  ): string {
    return `${this.capitalize(method)}${path
      .split("/")
      .map((part) => {
        const cleanPart = part.replace(/[{}]/g, "");
        return this.capitalize(
          cleanPart
            .split("_")
            .map((str) => this.capitalize(str))
            .join("")
        );
      })
      .join("")}${suffix}`;
  }

  /**
   * Creates a request body schema name
   * @param method - HTTP method
   * @param path - URL path
   * @returns Request body schema name
   */
  static createRequestBodySchemaName(method: string, path: string): string {
    return this.createSchemaName(method, path, "RequestBody");
  }

  /**
   * Creates a response body schema name
   * @param method - HTTP method
   * @param path - URL path
   * @returns Response body schema name
   */
  static createResponseBodySchemaName(method: string, path: string): string {
    return this.createSchemaName(method, path, "ResponseBody");
  }

  /**
   * Creates a path parameters schema name
   * @param method - HTTP method
   * @param path - URL path
   * @returns Path parameters schema name
   */
  static createPathParamSchemaName(method: string, path: string): string {
    return this.createSchemaName(method, path, "PathParams");
  }

  /**
   * Creates a query parameters schema name
   * @param method - HTTP method
   * @param path - URL path
   * @returns Query parameters schema name
   */
  static createQueryParamSchemaName(method: string, path: string): string {
    return this.createSchemaName(method, path, "QueryParams");
  }
}

/**
 * Utility class for file operations
 */
export class FileUtils {
  /**
   * Reads a file synchronously
   * @param path - Path to file
   * @returns File contents as string
   */
  static readFile(path: string): string {
    return fs.readFileSync(path, "utf-8");
  }
}

// Re-export utility functions for backward compatibility
export const capitalize = StringUtils.capitalize.bind(StringUtils);

export const createRequestBodySchemaName =
  StringUtils.createRequestBodySchemaName.bind(StringUtils);

export const createResponseBodySchemaName =
  StringUtils.createResponseBodySchemaName.bind(StringUtils);

export const createPathParamSchemaName =
  StringUtils.createPathParamSchemaName.bind(StringUtils);

export const createQueryParamSchemaName =
  StringUtils.createQueryParamSchemaName.bind(StringUtils);

export const readFile = FileUtils.readFile.bind(FileUtils);
