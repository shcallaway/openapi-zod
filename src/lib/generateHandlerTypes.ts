import { OpenApiDocument, OpenApiOperation } from "./types";

import {
  capitalize,
  createPathParamSchemaName,
  createQueryParamSchemaName,
  createRequestBodySchemaName,
  createResponseBodySchemaName,
} from "./utils";

// Convert path to handler name, e.g. "/pets/{id}" -> "getPetsId"
const createHandlerName = (method: string, path: string) => {
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
};

function generateHandlerType(
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
  const handlerName = createHandlerName(method, path);

  // Get request body type if it exists
  let requestType: string | undefined = undefined;

  if (operation.requestBody?.content?.["application/json"]?.schema) {
    requestType = createRequestBodySchemaName(method, path);
  }

  // Get response body type if it exists
  let responseType: string | undefined = undefined;

  // We only support 200 responses with application/json content
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

export const generateHandlerTypes = (
  openApiDocument: OpenApiDocument
): string[] => {
  const fileLines: string[] = [];

  if (!openApiDocument.paths) {
    return fileLines;
  }

  // Iterate through paths and generate handler types
  for (const [path, methods] of Object.entries(openApiDocument.paths)) {
    for (const [method, operation] of Object.entries(methods)) {
      const {
        name,
        requestType,
        responseType,
        pathParamsType,
        queryParamsType,
      } = generateHandlerType(method, path, operation);

      const pathParamsTypeString = pathParamsType ? pathParamsType : "{}";
      const queryParamsTypeString = queryParamsType ? queryParamsType : "{}";

      fileLines.push(
        `export type ${name} = Handler<${requestType}, ${pathParamsTypeString}, ${queryParamsTypeString}, ${responseType}>;`
      );
    }
  }

  return fileLines;
};
