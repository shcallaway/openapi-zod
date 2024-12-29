import {
  OpenApiDocument,
  OpenApiSchema,
  OpenApiSchemaType,
  OpenApiSchemaObject,
  OpenApiSchemaArray,
  OpenApiSchemaEnum,
  OpenApiSchemaRef,
  OpenApiParameter,
} from "./types";

import {
  createPathParamSchemaName,
  createQueryParamSchemaName,
  createRequestBodySchemaName,
  createResponseBodySchemaName,
} from "./utils";

export const resolveRef = (ref: string): string => {
  const refPath = ref.replace(/^#\/components\/schemas\//, "");
  return refPath;
};

export const generateZodSchemas = (
  openApiDocument: OpenApiDocument
): Record<string, string> => {
  const zodSchemas: Record<string, string> = {};

  const createZodSchema = (openApiSchema: OpenApiSchema): string => {
    // Handle object schemas
    if ((openApiSchema as OpenApiSchemaType).type === "object") {
      // Create zod schema for each property
      const zodProperties = Object.entries(
        (openApiSchema as OpenApiSchemaObject).properties || {}
      ).map(([key, value]: [string, any]) => {
        let zodPropertySchema = createZodSchema(value);

        // Use default values for required, nullable, default, and description
        const isRequired = value.required || false;
        const isNullable = value.nullable || false;
        const hasDefault = value.default !== undefined;
        const hasDescription = value.description !== undefined;

        // Add optional() if the property is not required
        if (!isRequired) {
          zodPropertySchema += ".optional()";
        }

        // Add nullable() if the property is nullable
        if (isNullable) {
          zodPropertySchema += ".nullable()";
        }

        // Add default value if the property has a default value
        if (hasDefault) {
          // Get the default value depending on the type
          const defaultValue = (() => {
            const def = value.default;

            switch (typeof def) {
              case "string":
                return `"${def}"`;
              case "boolean":
              case "number":
                return def.toString();
              case "object":
                if (def === null) return "null";
                if (Array.isArray(def)) return "[]";
                return def;
              default:
                throw new Error(
                  `Unsupported default value type: ${typeof def}`
                );
            }
          })();

          zodPropertySchema += `.default(${defaultValue})`;
        }

        // Add description if the property has a description
        if (hasDescription) {
          zodPropertySchema += `.describe(${JSON.stringify(
            value.description
          )})`;
        }

        // Wrap property name in quotes just in case the name itself is funky
        return `"${key}": ${zodPropertySchema}`;
      });

      return `z.object({ ${zodProperties.join(", ")} }).strict()`;
    }

    // Handle array schemas
    if ((openApiSchema as OpenApiSchemaType).type === "array") {
      const itemType = createZodSchema(
        (openApiSchema as OpenApiSchemaArray).items || {}
      );

      return `z.array(${itemType})`;
    }

    // Handle enum schemas
    if (
      (openApiSchema as OpenApiSchemaType).type === "string" &&
      (openApiSchema as OpenApiSchemaEnum).enum
    ) {
      return `z.enum([${(openApiSchema as OpenApiSchemaEnum).enum
        .map((e: string) => `"${e}"`)
        .join(", ")}])`;
    }

    // Handle string schemas
    if ((openApiSchema as OpenApiSchemaType).type === "string") {
      return "z.string()";
    }

    // Handle number schemas
    if (
      (openApiSchema as OpenApiSchemaType).type === "number" ||
      (openApiSchema as OpenApiSchemaType).type === "integer"
    ) {
      return "z.number()";
    }

    // Handle boolean schemas
    if ((openApiSchema as OpenApiSchemaType).type === "boolean") {
      return "z.boolean()";
    }

    // Handle ref schemas
    if ((openApiSchema as OpenApiSchemaRef).$ref) {
      const refName = resolveRef((openApiSchema as OpenApiSchemaRef).$ref);
      return `z.lazy(() => ${refName}Schema)`;
    }

    // Handle all other schemas
    return "z.any()";
  };

  // Generate zod schemas for all schemas
  for (const [schemaName, schemaDefinition] of Object.entries(
    openApiDocument.components?.schemas || {}
  )) {
    zodSchemas[schemaName] = createZodSchema(schemaDefinition);
  }

  // Generate zod schemas for request bodies in paths
  if (openApiDocument.paths) {
    for (const [path, pathItem] of Object.entries(openApiDocument.paths)) {
      for (const [method, operation] of Object.entries(pathItem)) {
        // We only support application/json request bodies
        if (operation.requestBody?.content?.["application/json"]?.schema) {
          const schema =
            operation.requestBody.content["application/json"].schema;

          const schemaName = createRequestBodySchemaName(method, path);

          zodSchemas[schemaName] = createZodSchema(schema);
        }
      }
    }
  }

  // Generate zod schemas for response bodies in paths
  if (openApiDocument.paths) {
    for (const [path, pathItem] of Object.entries(openApiDocument.paths)) {
      for (const [method, operation] of Object.entries(pathItem)) {
        // We only support 200 responses with application/json content
        if (operation.responses["200"]?.content?.["application/json"]?.schema) {
          const schema =
            operation.responses["200"].content["application/json"].schema;

          const schemaName = createResponseBodySchemaName(method, path);

          zodSchemas[schemaName] = createZodSchema(schema);
        }
      }
    }
  }

  // Generate zod schemas for path parameters
  if (openApiDocument.paths) {
    for (const [path, pathItem] of Object.entries(openApiDocument.paths)) {
      for (const [method, operation] of Object.entries(pathItem)) {
        if (operation.parameters) {
          const pathParams = operation.parameters.filter(
            (p: OpenApiParameter) => p.in === "path"
          );

          if (pathParams.length > 0) {
            const schemaName = createPathParamSchemaName(method, path);

            const schemaObj = pathParams.reduce(
              (acc: Record<string, string>, param: OpenApiParameter) => {
                acc[param.name] = createZodSchema(param.schema);
                return acc;
              },
              {} as Record<string, string>
            );

            const schemaEntries = Object.entries(schemaObj)
              .map(([key, value]) => `  ${key}: ${value}`)
              .join(",\n");

            zodSchemas[
              schemaName
            ] = `z.object({\n${schemaEntries}\n}).strict()`;
          }
        }
      }
    }
  }

  // Generate zod schemas for query parameters
  if (openApiDocument.paths) {
    for (const [path, pathItem] of Object.entries(openApiDocument.paths)) {
      for (const [method, operation] of Object.entries(pathItem)) {
        if (operation.parameters) {
          const queryParams = operation.parameters.filter(
            (p: OpenApiParameter) => p.in === "query"
          );

          if (queryParams.length > 0) {
            const schemaName = createQueryParamSchemaName(method, path);

            const schemaObj = queryParams.reduce(
              (acc: Record<string, string>, param: OpenApiParameter) => {
                acc[param.name] = createZodSchema(param.schema);
                return acc;
              },
              {} as Record<string, string>
            );

            const schemaEntries = Object.entries(schemaObj)
              .map(([key, value]) => `  ${key}: ${value}`)
              .join(",\n");

            zodSchemas[
              schemaName
            ] = `z.object({\n${schemaEntries}\n}).strict()`;
          }
        }
      }
    }
  }

  return zodSchemas;
};
