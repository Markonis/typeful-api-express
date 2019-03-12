import { Router, RequestHandler } from 'express';
import { ApiMounter, ApiEnpoint, ApiHandler, resolvePath } from 'typeful-api';

export default class ExpressApiMounter implements ApiMounter {
  constructor(public readonly router: Router) { }

  mountHandler<TInput, TOutput>(
    endpoint: ApiEnpoint<TInput, TOutput>,
    handler: ApiHandler<TInput, TOutput>): void {

    this.router.post(endpoint.pathStr(), async (req, res) => {
      const output = await handler(req.body as TInput);
      res.json(output);
    });
  }

  mountMiddleware<TInput, TOutput>(
    namespace: any, ...handlers: RequestHandler[]) {
    const path = '/' + resolvePath(namespace).join('/');
    this.router.use(path, handlers);
  }
}
