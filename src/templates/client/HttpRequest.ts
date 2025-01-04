export default `export class HttpError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body: any
  ) {
    super(\`HTTP Error \${status}: \${statusText}\`);
    this.name = "HttpError";
  }
};

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
};

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

  // Build URL
  const url = new URL(baseUrl + path);

  // Add path params
  url.pathname += Object.entries(params)
    .map(([key, value]) => \`/\${key}/\${value}\`)
    .join("");

  // Add query params
  url.search = new URLSearchParams(query).toString();

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
  if (response.status >= 200 && response.status < 300 && contentType?.includes("application/json")) {
    try {
      // TODO(Sherwood): We should validate the response body against the schema here
      responseBody = await response.json() as ResBody;
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
};`;
