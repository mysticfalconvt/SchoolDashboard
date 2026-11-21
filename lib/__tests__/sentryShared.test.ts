import { beforeSend, sharedOptions } from '../sentry/shared';

// Sentry 11's dataCollection defaults collect cookies, headers, bodies, user
// info, URL query strings and GraphQL variables. This app holds student data,
// so every category must stay off.
describe('Sentry shared options', () => {
  it('turns off every data-collection category', () => {
    const dc: any = sharedOptions.dataCollection;
    expect(dc).toBeDefined();
    for (const key of [
      'userInfo',
      'cookies',
      'httpHeaders',
      'urlQueryParams',
      'databaseQueryData',
      'queues',
      'stackFrameVariables',
    ]) {
      expect(dc[key]).toBe(false);
    }
    expect(dc.httpBodies).toEqual([]);
    expect(dc.graphQL).toEqual({ document: false, variables: false });
    expect(dc.genAI).toEqual({ inputs: false, outputs: false });
    expect(dc.mcp).toEqual({ inputs: false, outputs: false });
    expect((sharedOptions as any).sendDefaultPii).toBeUndefined();
  });

  it('beforeSend strips request details and keeps only the user id', () => {
    const event = beforeSend({
      exception: { values: [{ type: 'Error', value: 'boom' }] },
      user: { id: 'u1', email: 'kid@example.test', ip_address: '1.2.3.4' },
      request: {
        url: 'https://example.test/loginLink',
        headers: { cookie: 'x' },
        cookies: { a: 'b' },
        data: { password: 'secret' },
        query_string: 'token=abc',
      },
    });
    expect(event.user).toEqual({ id: 'u1' });
    expect(event.request.headers).toBeUndefined();
    expect(event.request.cookies).toBeUndefined();
    expect(event.request.data).toBeUndefined();
    expect(event.request.query_string).toBeUndefined();
  });
});
