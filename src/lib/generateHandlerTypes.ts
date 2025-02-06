import { OpenApiDocument, OpenApiOperation } from "./types";
import {
  capitalize,
  createPathParamSchemaName,
  createQueryParamSchemaName,
  createRequestBodySchemaName,
  createResponseBodySchemaName,
} from "./utils";
import { BaseGenerator } from "./BaseGenerator";
import { templates } from "./templates";
import { GeneratorConfig } from "./GeneratorConfig";

/**
 * Generator class for creating Express handler types from OpenAPI specs
 */
class HandlerTypesGenerator extends BaseGenerator {
  constructor(config: GeneratorConfig) {
    super(config);
  }

  /**
   * Converts a path to a handler name, e.g. "/pets/{id}" -> "getPetsIdHandler"
   */
  private createHandlerName(method: string, path: string): string {
    return this.createNameFromPath(method, path, "Handler");
  }

  /**
   * Generates type information for a single handler
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
   * Generates handler types for all paths in an OpenAPI document
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
        templates.handler(
          {
            name,
            requestType: requestType ?? "undefined",
            pathParamsType: pathParamsTypeString,
            queryParamsType: queryParamsTypeString,
            responseType: responseType ?? "{}",
          },
          this.config
        )
      );
    });

    return fileLines;
  }
}

/**
 * Generates handler types from an OpenAPI document
 */
export const generateHandlerTypes = (
  openApiDocument: OpenApiDocument,
  config: GeneratorConfig
): string[] => {
  const generator = new HandlerTypesGenerator(config);
  return generator.generateTypes(openApiDocument);
};
