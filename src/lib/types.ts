export interface OpenApiDocument {
  servers: {
    url: string;
  }[];
  components?: {
    schemas?: Record<string, OpenApiSchema>;
  };
  paths?: Record<string, OpenApiPath>;
}

export interface OpenApiPath {
  get?: OpenApiOperation;
  post?: OpenApiOperation;
  put?: OpenApiOperation;
  delete?: OpenApiOperation;
  patch?: OpenApiOperation;
}

export interface OpenApiOperation {
  requestBody?: OpenApiRequestBody;
  responses: OpenApiResponses;
  parameters?: OpenApiParameter[];
}

export interface OpenApiParameter {
  name: string;
  in: "path" | "query";
  schema: OpenApiSchema;
  required?: boolean;
  description?: string;
}

export interface OpenApiRequestBody {
  required: boolean;
  description?: string;
  content: Record<
    "application/json",
    {
      schema: OpenApiSchema;
    }
  >;
}

export interface OpenApiResponses {
  "200": OpenApiResponse;
}

export interface OpenApiResponse {
  description?: string;
  content: Record<
    "application/json",
    {
      schema: OpenApiSchema;
    }
  >;
}

export interface OpenApiSchemaBase {
  nullable?: boolean;
  default?: any;
  description?: string;
}

export interface OpenApiSchemaType extends OpenApiSchemaBase {
  type: "string" | "number" | "integer" | "boolean" | "array" | "object";
}

export interface OpenApiSchemaString extends OpenApiSchemaType {
  type: "string";
}

export interface OpenApiSchemaEnum extends OpenApiSchemaType {
  type: "string";
  enum: string[];
}

export interface OpenApiSchemaNumber extends OpenApiSchemaType {
  type: "number";
}

export interface OpenApiSchemaInteger extends OpenApiSchemaType {
  type: "integer";
}

export interface OpenApiSchemaBoolean extends OpenApiSchemaType {
  type: "boolean";
}

export interface OpenApiSchemaArray extends OpenApiSchemaType {
  type: "array";
  items: OpenApiSchema;
}

export interface OpenApiSchemaObject extends OpenApiSchemaType {
  type: "object";
  properties: Record<string, OpenApiSchemaProperty>;
}

export interface OpenApiSchemaRef extends OpenApiSchemaBase {
  $ref: string;
}

export type OpenApiSchemaProperty = OpenApiSchema & {
  required?: boolean;
};

export type OpenApiSchema =
  | OpenApiSchemaString
  | OpenApiSchemaEnum
  | OpenApiSchemaNumber
  | OpenApiSchemaInteger
  | OpenApiSchemaBoolean
  | OpenApiSchemaArray
  | OpenApiSchemaObject
  | OpenApiSchemaRef;
