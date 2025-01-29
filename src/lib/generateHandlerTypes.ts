import { OpenApiDocument, OpenApiOperation } from "./types";
import { Request as ExpressRequest } from "express";

import {
  capitalize,
  createPathParamSchemaName,
  createQueryParamSchemaName,
  createRequestBodySchemaName,
  createResponseBodySchemaName,
} from "./utils";

/**
 * Generator class for creating Express handler types from OpenAPI specs
 */
class HandlerTypesGenerator {
  /**
   * Converts a path to a handler name, e.g. "/pets/{id}" -> "getPetsId"
   * @param method - HTTP method
   * @param path - URL path
   * @returns Handler name
   */
  private createHandlerName(method: string, path: string): string {
    const pathParts = path.split("/").filter(Boolean);

    const normalizedPath = pathParts
      .map((part) => {
        // Remove brackets from path parameters
        const cleanPart = part.replace(/[{}]/g, "");
        // Split on underscores and capitalize each part
        return cleanPart.split("_").map(capitalize).join("");
      })
      .join("");

    return `${method}${capitalize(normalizedPath)}Handler`;
  }

  /**
   * Generates type information for a single handler
   * @param method - HTTP method
   * @param path - URL path
   * @param operation - OpenAPI operation object
   * @returns Handler type information
   */
  private generateHandlerType(
    method: string,
    path: string,
    operation: OpenApiOperation
  ): {
    name: string;
    requestType: string | undefined;
    responseType: string | undefined;
    pathParamsType: string | undefined;
    queryParamsType: string | undefined;
  } {
    const handlerName = this.createHandlerName(method, path);

    // Get request body type if it exists
    let requestType: string | undefined = undefined;
    if (operation.requestBody?.content?.["application/json"]?.schema) {
      requestType = createRequestBodySchemaName(method, path);
    }

    // Get response body type if it exists
    let responseType: string | undefined = undefined;
    if (operation.responses["200"]?.content?.["application/json"]?.schema) {
      responseType = createResponseBodySchemaName(method, path);
    }

    // Get path and query parameters
    let pathParamsType: string | undefined = undefined;
    let queryParamsType: string | undefined = undefined;

    if (operation.parameters?.some((param) => param.in === "path")) {
      pathParamsType = createPathParamSchemaName(method, path);
    }

    if (operation.parameters?.some((param) => param.in === "query")) {
      queryParamsType = createQueryParamSchemaName(method, path);
    }

    return {
      name: handlerName,
      requestType,
      responseType,
      pathParamsType,
      queryParamsType,
    };
  }

  /**
   * Iterates over paths in an OpenAPI document
   * @param openApiDocument - The OpenAPI document
   * @param callback - Callback function to execute for each path
   */
  private iterateOverPaths(
    openApiDocument: OpenApiDocument,
    callback: (
      path: string,
      method: string,
      operation: OpenApiOperation
    ) => void
  ): void {
    if (!openApiDocument.paths) return;

    for (const [path, pathItem] of Object.entries(openApiDocument.paths)) {
      for (const [method, operation] of Object.entries(pathItem)) {
        callback(path, method, operation);
      }
    }
  }

  /**
   * Generates handler types for all paths in an OpenAPI document
   * @param openApiDocument - The OpenAPI document
   * @returns Array of handler type declarations
   */
  public generateTypes(openApiDocument: OpenApiDocument): string[] {
    const fileLines: string[] = [];

    if (!openApiDocument.paths) {
      return fileLines;
    }

    this.iterateOverPaths(openApiDocument, (path, method, operation) => {
      const {
        name,
        requestType,
        responseType,
        pathParamsType,
        queryParamsType,
      } = this.generateHandlerType(method, path, operation);

      const pathParamsTypeString = pathParamsType ? pathParamsType : "{}";
      const queryParamsTypeString = queryParamsType ? queryParamsType : "{}";

      fileLines.push(
        `export type ${name} = Handler<${requestType}, ${pathParamsTypeString}, ${queryParamsTypeString}, ${responseType}>;`
      );
    });

    return fileLines;
  }
}

/**
 * Generates handler types from an OpenAPI document
 * @param openApiDocument - The OpenAPI document to generate types from
 * @returns Array of handler type declarations
 */
export const generateHandlerTypes = (
  openApiDocument: OpenApiDocument
): string[] => {
  const generator = new HandlerTypesGenerator();
  return generator.generateTypes(openApiDocument);
};
