import { OpenApiDocument, OpenApiOperation } from "./types";
import {
  capitalize,
  createPathParamSchemaName,
  createQueryParamSchemaName,
  createRequestBodySchemaName,
  createResponseBodySchemaName,
} from "./utils";

/**
 * Generator class for creating API client functions from OpenAPI specs
 */
class ClientGenerator {
  /**
   * Converts a path to a client function name, e.g. "/pets/{id}" -> "getPetsId"
   * @param method - HTTP method
   * @param path - URL path
   * @returns Client function name
   */
  private createClientFunctionName(method: string, path: string): string {
    const pathParts = path.split("/").filter(Boolean);

    const normalizedPath = pathParts
      .map((part) => {
        // Remove brackets from path parameters
        const cleanPart = part.replace(/[{}]/g, "");
        // Split on underscores and capitalize each part
        return cleanPart.split("_").map(capitalize).join("");
      })
      .join("");

    return `${method}${capitalize(normalizedPath)}`;
  }

  /**
   * Generates type information for a single client function
   * @param method - HTTP method
   * @param path - URL path
   * @param operation - OpenAPI operation object
   * @returns Client function type information
   */
  private generateClientType(
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
    const name = this.createClientFunctionName(method, path);

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
      name,
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
   * Generates client functions for all paths in an OpenAPI document
   * @param openApiDocument - The OpenAPI document
   * @returns Array of client function declarations
   */
  public generateClients(openApiDocument: OpenApiDocument): string[] {
    const fileLines: string[] = [];

    if (!openApiDocument.paths) {
      return fileLines;
    }

    if (!openApiDocument.servers) {
      throw new Error("No servers found in OpenAPI document");
    }

    // Use the first server as the client's base URL
    const baseUrl = openApiDocument.servers[0].url;

    this.iterateOverPaths(openApiDocument, (path, method, operation) => {
      const {
        name,
        requestType,
        responseType,
        pathParamsType,
        queryParamsType,
      } = this.generateClientType(method, path, operation);

      // Create args interface
      const argsInterfaceName = `${capitalize(name)}Args`;
      const argsInterfaceLines = [`  baseUrl?: string,`];

      if (pathParamsType) {
        argsInterfaceLines.push(`  params: ${pathParamsType},`);
      }

      if (queryParamsType) {
        argsInterfaceLines.push(`  query: ${queryParamsType},`);
      }

      if (requestType) {
        argsInterfaceLines.push(`  body: ${requestType},`);
      }

      argsInterfaceLines.push(`  headers?: Record<string, string>,`);

      fileLines.push(
        `export interface ${argsInterfaceName} {\n${argsInterfaceLines.join(
          "\n"
        )}\n}`
      );

      const finalRequestType = requestType ? requestType : "undefined";
      const finalResponseType = responseType ? responseType : "undefined";
      const finalPathParamsType = pathParamsType ? pathParamsType : "{}";
      const finalQueryParamsType = queryParamsType ? queryParamsType : "{}";

      fileLines.push(`export const ${name} = (
  args: ${argsInterfaceName}
) => {
  return httpRequest<${finalRequestType}, ${finalPathParamsType}, ${finalQueryParamsType}, ${finalResponseType}>({
    baseUrl: args.baseUrl ?? "${baseUrl}",
    path: "${path}",
    method: "${method.toUpperCase()}",
    ...args,
  });
}`);
    });

    return fileLines;
  }
}

/**
 * Generates client functions from an OpenAPI document
 * @param openApiDocument - The OpenAPI document to generate clients from
 * @returns Array of client function declarations
 */
export const generateClients = (openApiDocument: OpenApiDocument): string[] => {
  const generator = new ClientGenerator();
  return generator.generateClients(openApiDocument);
};
