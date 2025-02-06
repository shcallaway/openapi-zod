import { GeneratorConfig } from "./GeneratorConfig";
import { formatTemplate } from "./formatTemplate";

type TemplateVars = { [key: string]: string };

interface FileHeaderTemplateVars extends TemplateVars {}
interface ZodImportTemplateVars extends TemplateVars {}

interface HttpClientTemplateVars extends TemplateVars {
  baseUrl: string;
  path: string;
  method: string;
  requestType: string;
  responseType: string;
  pathParamsType: string;
  queryParamsType: string;
}

interface HandlerTemplateVars extends TemplateVars {
  name: string;
  requestType: string;
  responseType: string;
  pathParamsType: string;
  queryParamsType: string;
}

interface HandlerInterfaceTemplateVars extends TemplateVars {}

interface HttpRequestTemplateVars extends TemplateVars {}

interface SchemaTypeTemplateVars extends TemplateVars {
  schemaName: string;
}

interface SchemaExportTemplateVars extends TemplateVars {
  schemaName: string;
  zodSchema: string;
}

type Template<T extends TemplateVars = TemplateVars> = (
  vars: T,
  config: GeneratorConfig
) => string;

export const templates: Record<string, Template<any>> = {
  fileHeader: (_vars: FileHeaderTemplateVars, config: GeneratorConfig) =>
    formatTemplate(
      `/* This file was auto-generated. Do not edit it directly. */`,
      config
    ),

  zodImport: (_vars: ZodImportTemplateVars, config: GeneratorConfig) =>
    formatTemplate(`import { z } from 'zod';`, config),

  httpClient: (vars: HttpClientTemplateVars, config: GeneratorConfig) =>
    formatTemplate(
      `export const ${vars.method.toLowerCase()}${vars.path} = async <
  TRequest = ${vars.requestType},
  TPathParams = ${vars.pathParamsType},
  TQueryParams = ${vars.queryParamsType},
  TResponse = ${vars.responseType}
>(args: {
  baseUrl?: string;
  params?: TPathParams;
  query?: TQueryParams;
  body?: TRequest;
  headers?: Record<string, string>;
}) => {
  return httpRequest<TRequest, TPathParams, TQueryParams, TResponse>({
    baseUrl: args.baseUrl ?? "${vars.baseUrl}",
    path: "${vars.path}",
    method: "${vars.method.toUpperCase()}",
    ...args,
  });
};`,
      config
    ),

  handler: (vars: HandlerTemplateVars, config: GeneratorConfig) =>
    formatTemplate(
      `export type ${vars.name} = Handler<
  ${vars.requestType},
  ${vars.pathParamsType},
  ${vars.queryParamsType},
  ${vars.responseType}
>;`,
      config
    ),

  handlerInterface: (
    _vars: HandlerInterfaceTemplateVars,
    config: GeneratorConfig
  ) =>
    formatTemplate(
      `import { Request as ExpressRequest } from 'express';

export interface Request<
  Body,
  PathParams extends Record<string, any>,
  QueryParams extends Record<string, any>
> extends ExpressRequest {
  body: Body;
  params: PathParams;
  query: QueryParams;
}

export type Response<Body> = {
  status: 200 | 400 | 404 | 301 | 302;
  body?: Body;
  headers?: Record<string, string>;
};

export interface Handler<
  ReqBody,
  ReqPathParams extends Record<string, any>,
  ReqQueryParams extends Record<string, any>,
  ResBody
> {
  (req: Request<ReqBody, ReqPathParams, ReqQueryParams>): Promise<Response<ResBody>>;
}`,
      config
    ),

  httpRequest: (_vars: HttpRequestTemplateVars, config: GeneratorConfig) =>
    formatTemplate(
      `export async function httpRequest<
  TRequest,
  TPathParams extends Record<string, any>,
  TQueryParams extends Record<string, any>,
  TResponse
>(args: {
  baseUrl: string;
  path: string;
  method: string;
  params?: TPathParams;
  query?: TQueryParams;
  body?: TRequest;
  headers?: Record<string, string>;
}): Promise<TResponse> {
  const url = new URL(args.path, args.baseUrl);

  // Add query parameters
  if (args.query) {
    Object.entries(args.query).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  // Replace path parameters
  let finalPath = url.toString();
  if (args.params) {
    Object.entries(args.params).forEach(([key, value]) => {
      finalPath = finalPath.replace(\`{\${key}}\`, String(value));
    });
  }

  const response = await fetch(finalPath, {
    method: args.method,
    headers: {
      'Content-Type': 'application/json',
      ...args.headers,
    },
    body: args.body ? JSON.stringify(args.body) : undefined,
  });

  if (!response.ok) {
    throw new Error(\`HTTP error! status: \${response.status}\`);
  }

  return response.json();
}`,
      config
    ),

  schemaType: (vars: SchemaTypeTemplateVars, config: GeneratorConfig) =>
    formatTemplate(
      `export type ${vars.schemaName} = z.infer<typeof ${vars.schemaName}Schema>;`,
      config
    ),

  schemaExport: (vars: SchemaExportTemplateVars, config: GeneratorConfig) =>
    formatTemplate(
      `export const ${vars.schemaName}Schema = ${vars.zodSchema};`,
      config
    ),
} as const;
