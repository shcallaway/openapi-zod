/* This file was auto-generated. Do not edit it directly. */

/* ZOD SCHEMAS */

import { z } from "zod";

export const PetSchema = z
  .object({
    id: z.number().describe("The ID of the pet"),
    name: z
      .string()
      .optional()
      .nullable()
      .default("Fluffy")
      .describe("The name of the pet"),
    species: z.lazy(() => SpeciesSchema).default("cat"),
    owner_id: z.number().describe("The ID of the owner"),
    details: z
      .object({ age: z.number().optional().describe("The age of the pet") })
      .strict()
      .optional()
      .describe("Various details about the pet"),
  })
  .strict();

export const OwnerSchema = z
  .object({
    id: z.number().describe("The ID of the owner"),
    name: z.string().describe("The name of the owner"),
  })
  .strict();

export const SpeciesSchema = z.enum(["cat", "dog"]);

export const ListPetsResponseBodySchema = z
  .object({
    items: z.array(z.lazy(() => PetSchema)).default([]),
    count: z.number(),
  })
  .strict();

export const CreatePetRequestBodySchema = z
  .object({
    name: z.string().optional(),
    species: z.lazy(() => SpeciesSchema).optional(),
  })
  .strict();

export const GroomingToolSchema = z.object({ id: z.number() }).strict();

export const PutPetsIdRequestBodySchema = z.lazy(
  () => CreatePetRequestBodySchema
);

export const PatchPetsIdRequestBodySchema = z.lazy(
  () => CreatePetRequestBodySchema
);

export const PostPetsRequestBodySchema = z.lazy(
  () => CreatePetRequestBodySchema
);

export const GetOwnersIdResponseBodySchema = z
  .object({ id: z.number().optional(), name: z.string().optional() })
  .strict();

export const GetOwnersResponseBodySchema = z.array(z.lazy(() => OwnerSchema));

export const GetGroomingToolsResponseBodySchema = z.array(
  z.lazy(() => GroomingToolSchema)
);

export const GetPetsIdOwnersResponseBodySchema = z.lazy(() => OwnerSchema);

export const GetPetsIdResponseBodySchema = z.lazy(() => PetSchema);

export const PutPetsIdResponseBodySchema = z.lazy(() => PetSchema);

export const PatchPetsIdResponseBodySchema = z.lazy(() => PetSchema);

export const GetPetsResponseBodySchema = z.lazy(
  () => ListPetsResponseBodySchema
);

export const PostPetsResponseBodySchema = z.lazy(() => PetSchema);

export const GetOwnersIdPathParamsSchema = z
  .object({ id: z.number() })
  .strict();

export const GetPetsIdOwnersPathParamsSchema = z
  .object({ id: z.number() })
  .strict();

export const GetPetsIdPathParamsSchema = z.object({ id: z.number() }).strict();

export const PutPetsIdPathParamsSchema = z.object({ id: z.number() }).strict();

export const DeletePetsIdPathParamsSchema = z
  .object({ id: z.number() })
  .strict();

export const PatchPetsIdPathParamsSchema = z
  .object({ id: z.number() })
  .strict();

/* TYPES */

export type Pet = z.infer<typeof PetSchema>;

export type Owner = z.infer<typeof OwnerSchema>;

export type Species = z.infer<typeof SpeciesSchema>;

export type ListPetsResponseBody = z.infer<typeof ListPetsResponseBodySchema>;

export type CreatePetRequestBody = z.infer<typeof CreatePetRequestBodySchema>;

export type GroomingTool = z.infer<typeof GroomingToolSchema>;

export type PutPetsIdRequestBody = z.infer<typeof PutPetsIdRequestBodySchema>;

export type PatchPetsIdRequestBody = z.infer<
  typeof PatchPetsIdRequestBodySchema
>;

export type PostPetsRequestBody = z.infer<typeof PostPetsRequestBodySchema>;

export type GetOwnersIdResponseBody = z.infer<
  typeof GetOwnersIdResponseBodySchema
>;

export type GetOwnersResponseBody = z.infer<typeof GetOwnersResponseBodySchema>;

export type GetGroomingToolsResponseBody = z.infer<
  typeof GetGroomingToolsResponseBodySchema
>;

export type GetPetsIdOwnersResponseBody = z.infer<
  typeof GetPetsIdOwnersResponseBodySchema
>;

export type GetPetsIdResponseBody = z.infer<typeof GetPetsIdResponseBodySchema>;

export type PutPetsIdResponseBody = z.infer<typeof PutPetsIdResponseBodySchema>;

export type PatchPetsIdResponseBody = z.infer<
  typeof PatchPetsIdResponseBodySchema
>;

export type GetPetsResponseBody = z.infer<typeof GetPetsResponseBodySchema>;

export type PostPetsResponseBody = z.infer<typeof PostPetsResponseBodySchema>;

export type GetOwnersIdPathParams = z.infer<typeof GetOwnersIdPathParamsSchema>;

export type GetPetsIdOwnersPathParams = z.infer<
  typeof GetPetsIdOwnersPathParamsSchema
>;

export type GetPetsIdPathParams = z.infer<typeof GetPetsIdPathParamsSchema>;

export type PutPetsIdPathParams = z.infer<typeof PutPetsIdPathParamsSchema>;

export type DeletePetsIdPathParams = z.infer<
  typeof DeletePetsIdPathParamsSchema
>;

export type PatchPetsIdPathParams = z.infer<typeof PatchPetsIdPathParamsSchema>;

/* SERVER */

import { Request as ExpressRequest } from "express";

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
  status: 200 | 404 | 301 | 302;
  body?: Body;
  headers?: Record<string, string>;
};

export interface Handler<
  ReqBody,
  ReqPathParams extends Record<string, any>,
  ReqQueryParams extends Record<string, any>,
  ResBody
> {
  (req: Request<ReqBody, ReqPathParams, ReqQueryParams>): Promise<
    Response<ResBody>
  >;
}

export type getOwnersIdHandler = Handler<
  undefined,
  GetOwnersIdPathParams,
  {},
  GetOwnersIdResponseBody
>;

export type getOwnersHandler = Handler<
  undefined,
  {},
  {},
  GetOwnersResponseBody
>;

export type getGroomingToolsHandler = Handler<
  undefined,
  {},
  {},
  GetGroomingToolsResponseBody
>;

export type getPetsIdOwnersHandler = Handler<
  undefined,
  GetPetsIdOwnersPathParams,
  {},
  GetPetsIdOwnersResponseBody
>;

export type getPetsIdHandler = Handler<
  undefined,
  GetPetsIdPathParams,
  {},
  GetPetsIdResponseBody
>;

export type putPetsIdHandler = Handler<
  PutPetsIdRequestBody,
  PutPetsIdPathParams,
  {},
  PutPetsIdResponseBody
>;

export type deletePetsIdHandler = Handler<
  undefined,
  DeletePetsIdPathParams,
  {},
  undefined
>;

export type patchPetsIdHandler = Handler<
  PatchPetsIdRequestBody,
  PatchPetsIdPathParams,
  {},
  PatchPetsIdResponseBody
>;

export type getPetsHandler = Handler<undefined, {}, {}, GetPetsResponseBody>;

export type postPetsHandler = Handler<
  PostPetsRequestBody,
  {},
  {},
  PostPetsResponseBody
>;

/* CLIENT */

export class HttpError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body: any
  ) {
    super(`HTTP Error ${status}: ${statusText}`);
    this.name = "HttpError";
  }
}

export interface HttpRequestArgs<
  ReqBody,
  ReqPathParams extends Record<string, any>,
  ReqQueryParams extends Record<string, any>
> {
  baseUrl: string;
  path: string;
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  params?: ReqPathParams;
  query?: ReqQueryParams;
  body?: ReqBody;
  headers?: Record<string, string>;
}

export const httpRequest = async <
  ReqBody,
  ReqPathParams extends Record<string, any>,
  ReqQueryParams extends Record<string, any>,
  ResBody
>(
  args: HttpRequestArgs<ReqBody, ReqPathParams, ReqQueryParams>
): Promise<{
  status: number;
  body?: ResBody;
}> => {
  const {
    baseUrl,
    path,
    method,
    params = {},
    query = {},
    body,
    headers,
  } = args;

  // Build URL with path params
  let pathWithParams = path;

  for (const [key, value] of Object.entries(params)) {
    pathWithParams = pathWithParams.replace(
      `{${key}}`,
      encodeURIComponent(String(value))
    );
  }

  // Create URL with full path
  const url = new URL(`${baseUrl}${pathWithParams}`);

  // Add query params
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.append(key, String(value));
  }

  // Perform request
  const response = await fetch(url.toString(), {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });

  let responseBody;

  const contentType = response.headers.get("Content-Type");

  // If the response is successful and the content type is JSON, attempt to parse the body
  if (
    response.status >= 200 &&
    response.status < 300 &&
    contentType?.includes("application/json")
  ) {
    try {
      // TODO(Sherwood): We should validate the response body against the schema here
      responseBody = (await response.json()) as ResBody;
    } catch (error) {
      throw new HttpError(
        response.status,
        response.statusText,
        "Invalid JSON response body"
      );
    }
  }

  return {
    status: response.status,
    body: responseBody,
  };
};

export interface GetOwnersIdArgs {
  baseUrl?: string;
  params: GetOwnersIdPathParams;
}

export const getOwnersId = (args: GetOwnersIdArgs) => {
  return httpRequest<
    undefined,
    GetOwnersIdPathParams,
    {},
    GetOwnersIdResponseBody
  >({
    baseUrl: args.baseUrl ?? "http://api.example.com/v1",
    path: "/owners/{id}",
    method: "GET",
    ...args,
  });
};

export interface GetOwnersArgs {
  baseUrl?: string;
}

export const getOwners = (args: GetOwnersArgs) => {
  return httpRequest<undefined, {}, {}, GetOwnersResponseBody>({
    baseUrl: args.baseUrl ?? "http://api.example.com/v1",
    path: "/owners",
    method: "GET",
    ...args,
  });
};

export interface GetGroomingToolsArgs {
  baseUrl?: string;
}

export const getGroomingTools = (args: GetGroomingToolsArgs) => {
  return httpRequest<undefined, {}, {}, GetGroomingToolsResponseBody>({
    baseUrl: args.baseUrl ?? "http://api.example.com/v1",
    path: "/grooming_tools",
    method: "GET",
    ...args,
  });
};

export interface GetPetsIdOwnersArgs {
  baseUrl?: string;
  params: GetPetsIdOwnersPathParams;
}

export const getPetsIdOwners = (args: GetPetsIdOwnersArgs) => {
  return httpRequest<
    undefined,
    GetPetsIdOwnersPathParams,
    {},
    GetPetsIdOwnersResponseBody
  >({
    baseUrl: args.baseUrl ?? "http://api.example.com/v1",
    path: "/pets/{id}/owners",
    method: "GET",
    ...args,
  });
};

export interface GetPetsIdArgs {
  baseUrl?: string;
  params: GetPetsIdPathParams;
}

export const getPetsId = (args: GetPetsIdArgs) => {
  return httpRequest<undefined, GetPetsIdPathParams, {}, GetPetsIdResponseBody>(
    {
      baseUrl: args.baseUrl ?? "http://api.example.com/v1",
      path: "/pets/{id}",
      method: "GET",
      ...args,
    }
  );
};

export interface PutPetsIdArgs {
  baseUrl?: string;
  params: PutPetsIdPathParams;
  body: PutPetsIdRequestBody;
}

export const putPetsId = (args: PutPetsIdArgs) => {
  return httpRequest<
    PutPetsIdRequestBody,
    PutPetsIdPathParams,
    {},
    PutPetsIdResponseBody
  >({
    baseUrl: args.baseUrl ?? "http://api.example.com/v1",
    path: "/pets/{id}",
    method: "PUT",
    ...args,
  });
};

export interface DeletePetsIdArgs {
  baseUrl?: string;
  params: DeletePetsIdPathParams;
}

export const deletePetsId = (args: DeletePetsIdArgs) => {
  return httpRequest<undefined, DeletePetsIdPathParams, {}, undefined>({
    baseUrl: args.baseUrl ?? "http://api.example.com/v1",
    path: "/pets/{id}",
    method: "DELETE",
    ...args,
  });
};

export interface PatchPetsIdArgs {
  baseUrl?: string;
  params: PatchPetsIdPathParams;
  body: PatchPetsIdRequestBody;
}

export const patchPetsId = (args: PatchPetsIdArgs) => {
  return httpRequest<
    PatchPetsIdRequestBody,
    PatchPetsIdPathParams,
    {},
    PatchPetsIdResponseBody
  >({
    baseUrl: args.baseUrl ?? "http://api.example.com/v1",
    path: "/pets/{id}",
    method: "PATCH",
    ...args,
  });
};

export interface GetPetsArgs {
  baseUrl?: string;
}

export const getPets = (args: GetPetsArgs) => {
  return httpRequest<undefined, {}, {}, GetPetsResponseBody>({
    baseUrl: args.baseUrl ?? "http://api.example.com/v1",
    path: "/pets",
    method: "GET",
    ...args,
  });
};

export interface PostPetsArgs {
  baseUrl?: string;
  body: PostPetsRequestBody;
}

export const postPets = (args: PostPetsArgs) => {
  return httpRequest<PostPetsRequestBody, {}, {}, PostPetsResponseBody>({
    baseUrl: args.baseUrl ?? "http://api.example.com/v1",
    path: "/pets",
    method: "POST",
    ...args,
  });
};
