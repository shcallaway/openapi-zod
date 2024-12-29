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
pnpm publish --access public
```

## Local Usage

Use pnpm link to install the local module into your consuming project. This method creates a symbolic link between your local module and the project where you want to use it.

1. First, run the following command in your local @shcallaway/openapi-zod directory:

```bash
pnpm link --global
```

2. Then, run the following command in the consuming project directory:

```bash
pnpm link @shcallaway/openapi-zod
```

3. Now, any changes you make to the local @shcallaway/openapi-zod module will be reflected in the consuming project.

4. To stop using the local module, run the following command in the consuming project directory:

```bash
pnpm unlink @shcallaway/openapi-zod
```
