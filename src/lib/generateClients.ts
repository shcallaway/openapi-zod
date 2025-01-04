import { OpenApiDocument } from "./types";
import {
  capitalize,
  createPathParamSchemaName,
  createQueryParamSchemaName,
  createRequestBodySchemaName,
  createResponseBodySchemaName,
} from "./utils";

// Convert path to client function name, e.g. "/pets/{id}" -> "getPetsId"
const createClientFunctionName = (method: string, path: string) => {
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
};

export const generateClients = (openApiDocument: OpenApiDocument): string[] => {
  const fileLines: string[] = [];

  if (!openApiDocument.paths) {
    return fileLines;
  }

  if (!openApiDocument.servers) {
    throw new Error("No servers found in OpenAPI document");
  }

  // Use the first server as the client's base URL
  const baseUrl = openApiDocument.servers[0].url;

  // Iterate through paths and generate client functions
  for (const [path, methods] of Object.entries(openApiDocument.paths)) {
    for (const [method, operation] of Object.entries(methods)) {
      const functionName = createClientFunctionName(method, path);

      // Get request body type if it exists
      let requestType;
      if (operation.requestBody?.content?.["application/json"]?.schema) {
        requestType = createRequestBodySchemaName(method, path);
      }

      // Get response body type if it exists
      let responseType;
      if (operation.responses["200"]?.content?.["application/json"]?.schema) {
        responseType = createResponseBodySchemaName(method, path);
      }

      // Get path parameters
      let pathParamsType;
      if (operation.parameters?.some((param: any) => param.in === "path")) {
        pathParamsType = createPathParamSchemaName(method, path);
      }

      // Get query parameters
      let queryParamsType;
      if (operation.parameters?.some((param: any) => param.in === "query")) {
        queryParamsType = createQueryParamSchemaName(method, path);
      }

      // Create args interface
      const argsInterfaceName = `${capitalize(functionName)}Args`;

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

      if (operation.headers) {
        argsInterfaceLines.push(`  headers?: Record<string, string>,`);
      }

      fileLines.push(
        `export interface ${argsInterfaceName} {\n${argsInterfaceLines.join(
          "\n"
        )}\n}`
      );

      const finalRequestType = requestType ? requestType : "undefined";
      const finalResponseType = responseType ? responseType : "undefined";
      const finalPathParamsType = pathParamsType ? pathParamsType : "{}";
      const finalQueryParamsType = queryParamsType ? queryParamsType : "{}";

      fileLines.push(`export const ${functionName} = (
  args: ${argsInterfaceName}
) => {
  return httpRequest<${finalRequestType}, ${finalPathParamsType}, ${finalQueryParamsType}, ${finalResponseType}>({
    baseUrl: args.baseUrl ?? "${baseUrl}",
    path: "${path}",
    method: "${method.toUpperCase()}",
    ...args,
  });
}`);
    }
  }

  return fileLines;
};
