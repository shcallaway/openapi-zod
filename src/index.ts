import * as yaml from "js-yaml";
import * as fs from "fs";
import path from "path";

import { OpenApiDocument } from "./lib/types";

import { generateZodSchemas } from "./lib/generateZodSchemas";
import { generateHandlerTypes } from "./lib/generateHandlerTypes";

// TODO: Make these into args
const OPENAPI_FILE_NAME = "openapi.yaml";
const OUTPUT_FILE_NAME = "openApi.ts";

const openApiDocumentFilePath = path.join(process.cwd(), OPENAPI_FILE_NAME);

const openApiDocumentFileContent = fs.readFileSync(
  openApiDocumentFilePath,
  "utf-8"
);

const openApiDocument = yaml.load(
  openApiDocumentFileContent
) as OpenApiDocument;

// Ensure the generated directory exists and is empty
const generatedDirPath = path.join(process.cwd(), "generated");

if (fs.existsSync(generatedDirPath)) {
  fs.rmSync(generatedDirPath, { recursive: true });
}

fs.mkdirSync(generatedDirPath, { recursive: true });

const outputFilePath = path.join(generatedDirPath, OUTPUT_FILE_NAME);

// Add file header
const fileLines = [
  "/* This file was auto-generated. Do not edit it directly. */",
];

// Add zod schemas
fileLines.push("import { z } from 'zod';");
fileLines.push("/* ZOD SCHEMAS */");

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

// Add server types
fileLines.push("/* SERVER */");

fileLines.push(`export type Request<
  Body,
  PathParams extends Record<string, any>,
  QueryParams extends Record<string, any>
> = {
  body: Body;
  pathParams: PathParams;
  queryParams: QueryParams;
};`);

fileLines.push(`export type Response<Body> = {
  status: 200 | 404;
  body?: Body;
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

fs.writeFileSync(outputFilePath, fileLines.join("\n\n"));
