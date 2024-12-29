# OpenAPI Zod

A tool to generate Zod schemas, TypeScript types, and server stubs from an OpenAPI schema document.

To see how the generated code is used, see my [Petstore repository](https://github.com/shcallaway/petstore).

## Usage

```bash
pnpm install @shcallaway/openapi-zod
pnpm openapi-zod --schema ./openapi.yaml --output ./generated/api.ts
```

## Publishing

```bash
pnpm login
pnpm publish
```
