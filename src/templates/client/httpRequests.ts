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

  // Build URL with path params
  let pathWithParams = path;
  for (const [key, value] of Object.entries(params)) {
    pathWithParams = pathWithParams.replace(\`{\${key}}\`, encodeURIComponent(String(value)));
  }

  // Create URL with full path
  const url = new URL(\`\${baseUrl}\${pathWithParams}\`);

  // Add query params
  for (const [key, value] of Object.entries(query)) {
    switch (true) {
      case Array.isArray(value):
        // Handle arrays by appending each value separately
        value.forEach(item => url.searchParams.append(key, String(item)));
        break;
      case value !== null && typeof value === 'object':
        // Handle objects by stringifying them
        url.searchParams.append(key, JSON.stringify(value));
        break;
      default:
        // Handle primitives by converting to string
        url.searchParams.append(key, String(value));
        break;
    }
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
