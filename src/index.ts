#!/usr/bin/env node

import * as yaml from "js-yaml";
import * as fs from "fs";
import path from "path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { OpenApiDocument } from "./lib/types";

import { generateZodSchemas } from "./lib/generateZodSchemas";
import { generateHandlerTypes } from "./lib/generateHandlerTypes";
import { generateClientTypes } from "./lib/generateClientTypes";

// Parse CLI arguments
const argv = yargs(hideBin(process.argv))
  .options({
    schema: {
      type: "string",
      description: "Path to OpenAPI schema YAML file",
      demandOption: true,
    },
    output: {
      type: "string",
      description: "Output path for generated TypeScript file",
      default: "api.ts",
    },
  })
  .help().argv;

const openApiDocumentFilePath = path.resolve(
  process.cwd(),
  (argv as any).schema
);

const outputFilePath = path.resolve(process.cwd(), (argv as any).output);

// Create output directory if it doesn't exist
const outputDir = path.dirname(outputFilePath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const openApiDocumentFileContent = fs.readFileSync(
  openApiDocumentFilePath,
  "utf-8"
);

const openApiDocument = yaml.load(
  openApiDocumentFileContent
) as OpenApiDocument;

// Ensure the output directory exists
const outputDirPath = path.dirname(outputFilePath);

// Remove output file if it exists
if (fs.existsSync(outputFilePath)) {
  fs.unlinkSync(outputFilePath);
}

// Create output directory if needed
if (!fs.existsSync(outputDirPath)) {
  fs.mkdirSync(outputDirPath, { recursive: true });
}

// Add file header
const fileLines = [
  "/* This file was auto-generated. Do not edit it directly. */",
];

// Add zod schemas
fileLines.push("/* ZOD SCHEMAS */");

fileLines.push("import { z } from 'zod';");

const zodSchemas = generateZodSchemas(openApiDocument);

// Add schemas
for (const [schemaName, zodSchema] of Object.entries(zodSchemas)) {
  fileLines.push(`export const ${schemaName}Schema = ${zodSchema};`);
}

// Add TypeScript types inferred from zod schemas
fileLines.push("/* TYPES */");

for (const schemaName of Object.keys(zodSchemas)) {
  fileLines.push(
    `export type ${schemaName} = z.infer<typeof ${schemaName}Schema>;`
  );
}

// Add server handlers
fileLines.push("/* SERVER */");

fileLines.push("import { Request as ExpressRequest } from 'express';");

fileLines.push(`export interface Request<
  Body,
  PathParams extends Record<string, any>,
  QueryParams extends Record<string, any>
> extends ExpressRequest{
  body: Body;
  params: PathParams;
  query: QueryParams;
};`);

fileLines.push(`export type Response<Body> = {
  status: 200 | 404 | 301 | 302;
  body?: Body;
  headers?: Record<string, string>
};`);

fileLines.push(`export interface Handler<
  ReqBody,
  ReqPathParams extends Record<string, any>,
  ReqQueryParams extends Record<string, any>,
  ResBody
> {
  (req: Request<ReqBody, ReqPathParams, ReqQueryParams>): Promise<Response<ResBody>>;
};`);

const handlerTypes = generateHandlerTypes(openApiDocument);

fileLines.push(...handlerTypes);

// Add client functions
fileLines.push("/* CLIENT */");

fileLines.push(`export const httpRequest = async <ReqBody, ResBody>(
  baseUrl: string,
  path: string,
  pathParams: Record<string, any>,
  queryParams: Record<string, any>,
  method: string,
  body?: ReqBody,
  headers?: Record<string, string>
): Promise<ResBody> => {
  // Build URL
  const url = new URL(baseUrl + path);

  // Add path params
  url.pathname += Object.entries(pathParams)
    .map(([key, value]) => \`/\${key}/\${value}\`)
    .join("");

  // Add query params
  url.search = new URLSearchParams(queryParams).toString();

  // Perform request
  const response = await fetch(url.toString(), {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });

  // Return parsed response
  return response.json();
};`);

const clientTypes = generateClientTypes(openApiDocument);

fileLines.push(...clientTypes);

fs.writeFileSync(outputFilePath, fileLines.join("\n\n"));
