import express from 'express';
import ExpressApiMounter from '../api/main';
import { setPaths, ApiEndpoint } from 'typeful-api';
import { use, assert, request } from 'chai';
import chaiHttp from 'chai-http';
import bodyParser from 'body-parser';

use(chaiHttp);

interface TestPayload {
  info: string
}

describe('ExpressApiMounter', () => {

  const server = express();
  server.use(bodyParser.json());
  const mounter = new ExpressApiMounter(server);

  const api = setPaths({
    test: {
      hello: new ApiEndpoint<TestPayload, TestPayload>()
    }
  });

  mounter.mountMiddleware(api.test, (_req, res, next) => {
    res.setHeader('x-middleware-test', 'Test Value');
    next();
  });

  mounter.mountHandler(api.test.hello, async (payload) => {
    return { info: payload.info + ' Woohoo!' };
  });

  describe('mountHandler', () => {
    it('returns the correct response for a POST request', (done) => {
      request(server)
        .post('/test/hello')
        .send({ info: 'Test' })
        .end((_err, res) => {
          assert.deepEqual(res.body, { info: 'Test Woohoo!' });
          done();
        });
    });

    it('does not mount HTTP verbs other than POST', (done) => {
      request(server)
        .put('/test/hello')
        .send({ info: 'Test' })
        .end((_err, res) => {
          assert.isTrue(res.notFound);
          done();
        });
    });

    it('does not mount other paths', (done) => {
      request(server)
        .post('/test/other')
        .send({ info: 'Test' })
        .end((_err, res) => {
          assert.isTrue(res.notFound);
          done();
        });
    });
  });

  describe('mountMiddleware', () => {
    it('mounts the middleware on the correct path', (done) => {
      request(server)
        .post('/test/hello')
        .send({ info: 'Test' })
        .end((_err, res) => {
          assert.equal(res.header['x-middleware-test'], 'Test Value');
          done();
        });
    });

    it('does not mount the middleware on other paths', (done) => {
      request(server)
        .post('/other/hello')
        .send({ info: 'Test' })
        .end((_err, res) => {
          assert.notExists(res.header['x-middleware-test']);
          done();
        });
    })
  });
});
