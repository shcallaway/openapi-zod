import { OpenApiDocument, OpenApiOperation } from "./types";
import {
  capitalize,
  createPathParamSchemaName,
  createQueryParamSchemaName,
  createRequestBodySchemaName,
  createResponseBodySchemaName,
} from "./utils";
import { BaseGenerator } from "./BaseGenerator";
import { GeneratorConfig } from "./GeneratorConfig";

/**
 * Generator class for creating API client functions from OpenAPI specs
 */
class ClientGenerator extends BaseGenerator {
  constructor(config: GeneratorConfig) {
    super(config);
  }

  /**
   * Converts a path to a client function name, e.g. "/pets/{id}" -> "getPetsId"
   */
  private createClientFunctionName(method: string, path: string): string {
    return this.createNameFromPath(method, path);
  }

  /**
   * Generates type information for a single client function
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
   * Generates client functions for all paths in an OpenAPI document
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

      const finalRequestType = requestType ?? "undefined";
      const finalResponseType = responseType ?? "undefined";

      const finalPathParamsType = pathParamsType ?? "{}";
      const finalQueryParamsType = queryParamsType ?? "{}";

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
 */
export const generateClients = (
  openApiDocument: OpenApiDocument,
  config: GeneratorConfig
): string[] => {
  const generator = new ClientGenerator(config);
  return generator.generateClients(openApiDocument);
};
