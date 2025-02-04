export default `import { Request as ExpressRequest } from 'express';

export interface Request<
  Body,
  PathParams extends Record<string, any>,
  QueryParams extends Record<string, any>
> extends ExpressRequest{
  body: Body;
  params: PathParams;
  query: QueryParams;
};

export type Response<Body> = {
  status: 200 | 400 | 404 | 301 | 302;
  body?: Body;
  headers?: Record<string, string>
};

export interface Handler<
  ReqBody,
  ReqPathParams extends Record<string, any>,
  ReqQueryParams extends Record<string, any>,
  ResBody
> {
  (req: Request<ReqBody, ReqPathParams, ReqQueryParams>): Promise<Response<ResBody>>;
};`;
