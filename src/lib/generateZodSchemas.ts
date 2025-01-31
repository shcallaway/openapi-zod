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
  OpenApiSchemaString,
  OpenApiSchemaNumber,
  OpenApiSchemaInteger,
  OpenApiOperation,
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

/**
 * Generator class for converting OpenAPI schemas to Zod schemas
 */
class ZodSchemaGenerator {
  /**
   * Type guard to check if a schema is an object schema
   * @param schema - The OpenAPI schema to check
   * @returns True if the schema is an object schema
   */
  private isObjectSchema(schema: OpenApiSchema): schema is OpenApiSchemaObject {
    return (schema as OpenApiSchemaType).type === "object";
  }

  /**
   * Creates a Zod object schema from key-value pairs
   * @param keyValuePairs - Array of [key, value] pairs representing object properties
   * @returns Zod object schema string
   */
  private createZodObjectHelper(keyValuePairs: [string, string][]): string {
    const zodObjectProperties = keyValuePairs.map(([key, value]) => {
      return `"${key}": ${value}`;
    });

    const propertiesContent =
      zodObjectProperties.length > 0 ? zodObjectProperties.join(", ") : "";

    return `z.object({${propertiesContent}}).strict()`;
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
   * Creates a Zod enum schema
   * @param values - Array of enum values
   * @returns Zod enum schema string
   */
  private createZodEnum(values: string[]): string {
    return `z.enum([${values.map((e: string) => `"${e}"`).join(", ")}])`;
  }

  /**
   * Creates a Zod string schema with validations
   * @param schema - OpenAPI string schema
   * @returns Zod string schema string
   */
  private createZodString(schema: OpenApiSchemaString): string {
    let zodString = "z.string()";

    // Add string format validations
    if (schema.format) {
      switch (schema.format) {
        case "email":
          zodString += ".email()";
          break;
        case "uuid":
          zodString += ".uuid()";
          break;
        case "date-time":
          // Keep as string but add ISO date-time validation
          zodString += `.datetime({ message: "Invalid ISO date-time string" })`;
          break;
        case "date":
          // Keep as string but add ISO date validation
          zodString += `.regex(/^\\d{4}-\\d{2}-\\d{2}$/, { message: "Invalid ISO date string (YYYY-MM-DD)" })`;
          break;
        case "uri":
          zodString += ".url()";
          break;
      }
    }

    // Add pattern validation
    if (schema.pattern) {
      zodString += `.regex(new RegExp("${schema.pattern.replace(
        /"/g,
        '\\"'
      )}"))`;
    }

    // Add min/max length validations
    if (schema.minLength !== undefined) {
      zodString += `.min(${schema.minLength})`;
    }
    if (schema.maxLength !== undefined) {
      zodString += `.max(${schema.maxLength})`;
    }

    return zodString;
  }

  /**
   * Creates a Zod number schema with validations
   * @param schema - OpenAPI number schema
   * @returns Zod number schema string
   */
  private createZodNumber(
    schema: OpenApiSchemaNumber | OpenApiSchemaInteger
  ): string {
    let zodNumber = "z.number()";

    // Add integer validation for integer type
    if ((schema as OpenApiSchemaType).type === "integer") {
      zodNumber += ".int()";
    }

    // Add min/max validations
    if (schema.minimum !== undefined) {
      zodNumber += `.min(${schema.minimum})`;
    }
    if (schema.maximum !== undefined) {
      zodNumber += `.max(${schema.maximum})`;
    }

    return zodNumber;
  }

  private createZodBoolean(): string {
    return "z.boolean()";
  }

  private createZodRef(ref: string): string {
    const refName = resolveRef(ref);
    return `z.lazy(() => ${refName}Schema)`;
  }

  private createZodAny(): string {
    return "z.any()";
  }

  /**
   * Creates a Zod array schema with validations
   * @param schema - OpenAPI array schema
   * @returns Zod array schema string
   */
  private createZodArray(schema: OpenApiSchemaArray): string {
    const itemType = this.createZodSchema(schema.items);
    let zodArray = `z.array(${itemType})`;

    // Add min/max items validations
    if (schema.minItems !== undefined) {
      zodArray += `.min(${schema.minItems})`;
    }
    if (schema.maxItems !== undefined) {
      zodArray += `.max(${schema.maxItems})`;
    }

    return zodArray;
  }

  /**
   * Stringifies a default value for use in a Zod schema
   * @param value - The default value to stringify
   * @returns Stringified default value
   */
  private stringifyDefault(value: any): string {
    if (value === null) return "null";
    if (value === undefined) return "undefined";

    switch (typeof value) {
      case "string":
        return `"${value.replace(/"/g, '\\"')}"`;
      case "number":
      case "boolean":
        return value.toString();
      case "object":
        if (Array.isArray(value)) {
          return `[${value.map((v) => this.stringifyDefault(v)).join(", ")}]`;
        }
        try {
          return JSON.stringify(value);
        } catch (error) {
          console.warn(
            `Warning: Could not stringify default value: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
          return "undefined";
        }
      default:
        return "undefined";
    }
  }

  /**
   * Creates a Zod schema from an OpenAPI schema
   * @param openApiSchema - OpenAPI schema
   * @returns Zod schema string
   */
  private createZodSchema(openApiSchema: OpenApiSchema): string {
    if (this.isObjectSchema(openApiSchema)) {
      return this.createZodObjectFromProperties(
        openApiSchema.properties || {},
        openApiSchema.required
      );
    }

    if ((openApiSchema as OpenApiSchemaType).type === "array") {
      return this.createZodArray(openApiSchema as OpenApiSchemaArray);
    }

    if (
      (openApiSchema as OpenApiSchemaType).type === "string" &&
      (openApiSchema as OpenApiSchemaEnum).enum
    ) {
      return this.createZodEnum((openApiSchema as OpenApiSchemaEnum).enum);
    }

    if ((openApiSchema as OpenApiSchemaType).type === "string") {
      return this.createZodString(openApiSchema as OpenApiSchemaString);
    }

    if (
      (openApiSchema as OpenApiSchemaType).type === "number" ||
      (openApiSchema as OpenApiSchemaType).type === "integer"
    ) {
      return this.createZodNumber(openApiSchema as OpenApiSchemaNumber);
    }

    if ((openApiSchema as OpenApiSchemaType).type === "boolean") {
      return this.createZodBoolean();
    }

    if ((openApiSchema as OpenApiSchemaRef).$ref) {
      return this.createZodRef((openApiSchema as OpenApiSchemaRef).$ref);
    }

    return this.createZodAny();
  }

  private createZodObjectFromProperties(
    properties: OpenApiSchemaObject["properties"],
    required?: string[]
  ): string {
    const createZodObjectProperty = (
      property: OpenApiSchemaProperty,
      propertyName: string
    ): string => {
      let propertySchema = this.createZodSchema(property);

      const isNullable = property.nullable || false;
      const hasDefault = property.default !== undefined;
      const hasDescription = property.description !== undefined;
      const isRequired = required?.includes(propertyName) ?? false;

      if (isNullable) {
        propertySchema += ".nullable()";
      }

      if (!isRequired) {
        propertySchema += ".optional()";
      }

      if (hasDefault) {
        const defaultValue = this.stringifyDefault(property.default);
        if (defaultValue !== "undefined") {
          propertySchema += `.default(${defaultValue})`;
        }
      }

      if (hasDescription) {
        propertySchema += `.describe(${JSON.stringify(property.description)})`;
      }

      return propertySchema;
    };

    const keyValuePairs = Object.entries(properties).map(([key, value]) => {
      return [key, createZodObjectProperty(value, key)] as [string, string];
    });

    return this.createZodObjectHelper(keyValuePairs);
  }

  public createZodObjectFromParameters(parameters: OpenApiParameter[]): string {
    const createZodObjectProperty = (parameter: OpenApiParameter): string => {
      let propertySchema = this.createZodSchema(parameter.schema);

      const isRequired = parameter.required || false;
      const isNullable = parameter.nullable || false;
      const hasDefault = parameter.default !== undefined;
      const hasDescription = parameter.description !== undefined;

      if (!isRequired) {
        propertySchema += ".optional()";
      }

      if (isNullable) {
        propertySchema += ".nullable()";
      }

      if (hasDefault) {
        const defaultValue = this.stringifyDefault(parameter.default);
        if (defaultValue !== "undefined") {
          propertySchema += `.default(${defaultValue})`;
        }
      }

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

    return this.createZodObjectHelper(keyValuePairs);
  }

  public generateSchemas(
    openApiDocument: OpenApiDocument
  ): Record<string, string> {
    const zodSchemas: Record<string, string> = {};

    // Generate zod schemas for all schemas
    for (const [schemaName, schemaDefinition] of Object.entries(
      openApiDocument.components?.schemas || {}
    )) {
      zodSchemas[schemaName] = this.createZodSchema(schemaDefinition);
    }

    // Generate zod schemas for request bodies in paths
    this.iterateOverPaths(openApiDocument, (path, method, operation) => {
      if (operation.requestBody?.content?.["application/json"]?.schema) {
        const schema = operation.requestBody.content["application/json"].schema;

        // Create a copy of the schema to avoid modifying the original
        const schemaForZod = { ...schema };

        // If the request body is required and it's an object schema,
        // we need to ensure the schema itself is required but preserve
        // the individual property requirements
        if (
          operation.requestBody.required &&
          this.isObjectSchema(schemaForZod)
        ) {
          // Preserve existing required properties or initialize empty array
          schemaForZod.required = schemaForZod.required || [];
        }

        const schemaName = createRequestBodySchemaName(method, path);
        zodSchemas[schemaName] = this.createZodSchema(schemaForZod);
      }
    });

    // Generate zod schemas for response bodies in paths
    this.iterateOverPaths(openApiDocument, (path, method, operation) => {
      if (operation.responses["200"]?.content?.["application/json"]?.schema) {
        const schema =
          operation.responses["200"].content["application/json"].schema;
        const schemaName = createResponseBodySchemaName(method, path);
        zodSchemas[schemaName] = this.createZodSchema(schema);
      }
    });

    // Generate zod schemas for path parameters
    this.iterateOverPaths(openApiDocument, (path, method, operation) => {
      if (operation.parameters) {
        const pathParams = operation.parameters.filter(
          (p: OpenApiParameter) => p.in === "path"
        );

        if (pathParams.length > 0) {
          const schemaName = createPathParamSchemaName(method, path);
          zodSchemas[schemaName] =
            this.createZodObjectFromParameters(pathParams);
        }
      }
    });

    // Generate zod schemas for query parameters
    this.iterateOverPaths(openApiDocument, (path, method, operation) => {
      if (operation.parameters) {
        const queryParams = operation.parameters.filter(
          (p: OpenApiParameter) => p.in === "query"
        );

        if (queryParams.length > 0) {
          const schemaName = createQueryParamSchemaName(method, path);
          zodSchemas[schemaName] =
            this.createZodObjectFromParameters(queryParams);
        }
      }
    });

    return zodSchemas;
  }
}

/**
 * Generates Zod schemas from an OpenAPI document
 * @param openApiDocument - The OpenAPI document to generate schemas from
 * @returns Record of schema names to Zod schema strings
 */
export const generateZodSchemas = (
  openApiDocument: OpenApiDocument
): Record<string, string> => {
  const generator = new ZodSchemaGenerator();
  return generator.generateSchemas(openApiDocument);
};
