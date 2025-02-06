#!/usr/bin/env node

import * as yaml from "js-yaml";
import * as fs from "fs";
import path from "path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { OpenApiDocument } from "./lib/types";

import { generateZodSchemas } from "./lib/generateZodSchemas";
import { generateHandlerTypes } from "./lib/generateHandlerTypes";
import { generateClients } from "./lib/generateClients";

import { templates } from "./lib/templates";
import { createConfig } from "./lib/createConfig";

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

const generatorConfig = createConfig();

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

// Create file lines array
const fileLines = [templates.fileHeader({}, generatorConfig)];

// Add zod schemas
fileLines.push("/* ZOD SCHEMAS */");

fileLines.push(templates.zodImport({}, generatorConfig));

const zodSchemas = generateZodSchemas(openApiDocument, generatorConfig);

// Add schemas
for (const [schemaName, zodSchema] of Object.entries(zodSchemas)) {
  fileLines.push(
    templates.schemaExport({ schemaName, zodSchema }, generatorConfig)
  );
}

// Add TypeScript types inferred from zod schemas
fileLines.push("/* TYPES */");

for (const schemaName of Object.keys(zodSchemas)) {
  fileLines.push(templates.schemaType({ schemaName }, generatorConfig));
}

// Add server handlers
fileLines.push("/* SERVER */");

fileLines.push(templates.handlerInterface({}, generatorConfig));

const handlerTypes = generateHandlerTypes(openApiDocument, generatorConfig);

fileLines.push(...handlerTypes);

// Add client functions
fileLines.push("/* CLIENT */");

fileLines.push(templates.httpRequest({}, generatorConfig));

const clientTypes = generateClients(openApiDocument, generatorConfig);

fileLines.push(...clientTypes);

fs.writeFileSync(outputFilePath, fileLines.join("\n\n"));
