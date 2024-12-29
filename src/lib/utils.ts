const createSchemaName = (
  method: string,
  path: string,
  suffix: "RequestBody" | "ResponseBody" | "PathParams" | "QueryParams"
): string => {
  return `${capitalize(method)}${path
    .split("/")
    .map((part) => {
      const cleanPart = part.replace(/[{}]/g, "");
      return capitalize(cleanPart);
    })
    .join("")}${suffix}`;
};

export const createRequestBodySchemaName = (method: string, path: string) =>
  createSchemaName(method, path, "RequestBody");

export const createResponseBodySchemaName = (method: string, path: string) =>
  createSchemaName(method, path, "ResponseBody");

export const createPathParamSchemaName = (method: string, path: string) =>
  createSchemaName(method, path, "PathParams");

export const createQueryParamSchemaName = (method: string, path: string) =>
  createSchemaName(method, path, "QueryParams");

export const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};
