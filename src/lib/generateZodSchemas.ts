import {
  OpenApiDocument,
  OpenApiSchema,
  OpenApiSchemaType,
  OpenApiSchemaObject,
  OpenApiSchemaArray,
  OpenApiSchemaEnum,
  OpenApiSchemaRef,
  OpenApiParameter,
  OpenApiSchemaProperty,
} from "./types";

import {
  createPathParamSchemaName,
  createQueryParamSchemaName,
  createRequestBodySchemaName,
  createResponseBodySchemaName,
} from "./utils";

export const resolveRef = (ref: string): string => {
  return ref.replace(/^#\/components\/schemas\//, "");
};

const createZodEnum = (values: string[]): string => {
  return `z.enum([${values.map((e: string) => `"${e}"`).join(", ")}])`;
};

const createZodString = (): string => {
  return "z.string()";
};

const createZodNumber = (): string => {
  return "z.number()";
};

const createZodBoolean = (): string => {
  return "z.boolean()";
};

const createZodRef = (ref: string): string => {
  const refName = resolveRef(ref);
  return `z.lazy(() => ${refName}Schema)`;
};

const createZodAny = (): string => {
  return "z.any()";
};

const createZodArray = (items: OpenApiSchema): string => {
  const itemType = createZodSchema(items);
  return `z.array(${itemType})`;
};

const createZodSchema = (openApiSchema: OpenApiSchema): string => {
  // Handle object schemas
  if ((openApiSchema as OpenApiSchemaType).type === "object") {
    return createZodObjectFromProperties(
      (openApiSchema as OpenApiSchemaObject).properties || {}
    );
  }

  // Handle array schemas
  if ((openApiSchema as OpenApiSchemaType).type === "array") {
    return createZodArray((openApiSchema as OpenApiSchemaArray).items);
  }

  // Handle enum schemas
  if (
    (openApiSchema as OpenApiSchemaType).type === "string" &&
    (openApiSchema as OpenApiSchemaEnum).enum
  ) {
    return createZodEnum((openApiSchema as OpenApiSchemaEnum).enum);
  }

  // Handle string schemas
  if ((openApiSchema as OpenApiSchemaType).type === "string") {
    return createZodString();
  }

  // Handle number schemas
  if (
    (openApiSchema as OpenApiSchemaType).type === "number" ||
    (openApiSchema as OpenApiSchemaType).type === "integer"
  ) {
    return createZodNumber();
  }

  // Handle boolean schemas
  if ((openApiSchema as OpenApiSchemaType).type === "boolean") {
    return createZodBoolean();
  }

  // Handle ref schemas
  if ((openApiSchema as OpenApiSchemaRef).$ref) {
    return createZodRef((openApiSchema as OpenApiSchemaRef).$ref);
  }

  // Handle all other schemas
  return createZodAny();
};

export const createZodObjectHelper = (
  keyValuePairs: [string, string][]
): string => {
  const zodObjectProperties = keyValuePairs.map(([key, value]) => {
    return `"${key}": ${value}`;
  });

  // Combine all properties into a single string
  const propertiesContent =
    zodObjectProperties.length > 0 ? zodObjectProperties.join(", ") : "";

  // Create the Zod object schema
  return `z.object({${propertiesContent}}).strict()`;
};

export const createZodObjectFromParameters = (
  parameters: OpenApiParameter[]
): string => {
  const createZodObjectProperty = (parameter: OpenApiParameter): string => {
    let propertySchema = createZodSchema(parameter.schema);

    // Use default values for required, nullable, default, and description
    const isRequired = parameter.required || false;
    const isNullable = parameter.nullable || false;
    const hasDefault = parameter.default !== undefined;
    const hasDescription = parameter.description !== undefined;

    // Add optional() if the property is not required
    if (!isRequired) {
      propertySchema += ".optional()";
    }

    // Add nullable() if the property is nullable
    if (isNullable) {
      propertySchema += ".nullable()";
    }

    // Add default value if the property has a default value
    if (hasDefault) {
      // Get the default value depending on the type
      const defaultValue = (() => {
        const def = parameter.default;

        switch (typeof def) {
          // Handle string defaults
          case "string":
            return `"${def}"`;

          // Handle boolean defaults
          case "boolean":
            return def.toString();

          // Handle number defaults
          case "number":
            return def.toString();

          // Handle object defaults
          case "object":
            if (def === null) return "null";
            if (Array.isArray(def)) return "[]";
            return def;
          default:
            throw new Error(`Unsupported default value type: ${typeof def}`);
        }
      })();

      propertySchema += `.default(${defaultValue})`;
    }

    // Add description if the property has a description
    if (hasDescription) {
      propertySchema += `.describe(${JSON.stringify(parameter.description)})`;
    }

    return propertySchema;
  };
  const keyValuePairs = parameters.map((parameter) => {
    return [parameter.name, createZodObjectProperty(parameter)] as [
      string,
      string
    ];
  });

  return createZodObjectHelper(keyValuePairs);
};

export const createZodObjectFromProperties = (
  properties: OpenApiSchemaObject["properties"]
): string => {
  const createZodObjectProperty = (property: OpenApiSchemaProperty): string => {
    let propertySchema = createZodSchema(property);

    // Use default values for required, nullable, default, and description
    const isRequired = property.required || false;
    const isNullable = property.nullable || false;
    const hasDefault = property.default !== undefined;
    const hasDescription = property.description !== undefined;

    // Add optional() if the property is not required
    if (!isRequired) {
      propertySchema += ".optional()";
    }

    // Add nullable() if the property is nullable
    if (isNullable) {
      propertySchema += ".nullable()";
    }

    // Add default value if the property has a default value
    if (hasDefault) {
      // Get the default value depending on the type
      const defaultValue = (() => {
        const def = property.default;

        switch (typeof def) {
          // Handle string defaults
          case "string":
            return `"${def}"`;

          // Handle boolean defaults
          case "boolean":
            return def.toString();

          // Handle number defaults
          case "number":
            return def.toString();

          // Handle object defaults
          case "object":
            if (def === null) return "null";
            if (Array.isArray(def)) return "[]";
            return def;
          default:
            throw new Error(`Unsupported default value type: ${typeof def}`);
        }
      })();

      propertySchema += `.default(${defaultValue})`;
    }

    // Add description if the property has a description
    if (hasDescription) {
      propertySchema += `.describe(${JSON.stringify(property.description)})`;
    }

    return propertySchema;
  };

  const keyValuePairs = Object.entries(properties).map(([key, value]) => {
    return [key, createZodObjectProperty(value)] as [string, string];
  });

  return createZodObjectHelper(keyValuePairs);
};

export const generateZodSchemas = (
  openApiDocument: OpenApiDocument
): Record<string, string> => {
  const zodSchemas: Record<string, string> = {};

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

            zodSchemas[schemaName] = createZodObjectFromParameters(pathParams);
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

            zodSchemas[schemaName] = createZodObjectFromParameters(queryParams);
          }
        }
      }
    }
  }

  return zodSchemas;
};
