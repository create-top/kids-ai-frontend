import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearToken, getToken, setToken } from '@/utils/token';
import {
  ApiError,
  coreFetch,
  jeecgFetch,
  jsonBody,
  setAuthExpiredHandler,
} from './http';

function mockResponse(body: unknown, init: { status?: number } = {}) {
  const status = init.status ?? 200;
  const text = body === undefined ? '' : typeof body === 'string' ? body : JSON.stringify(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => text,
    json: async () => JSON.parse(text),
  } as unknown as Response;
}

describe('http', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    clearToken();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('jeecgFetch', () => {
    it('带上令牌并取出 result', async () => {
      setToken('abc');
      fetchMock.mockResolvedValue(mockResponse({ success: true, code: 200, result: { name: 'x' } }));

      const result = await jeecgFetch<{ name: string }>('/sys/user/getUserInfo');

      expect(result).toEqual({ name: 'x' });
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe('/jeecgboot/sys/user/getUserInfo');
      expect((init.headers as Headers).get('X-Access-Token')).toBe('abc');
    });

    it('没有令牌时不带令牌头', async () => {
      fetchMock.mockResolvedValue(mockResponse({ success: true, result: 'img' }));

      await jeecgFetch('/sys/randomImage/k1');

      expect((fetchMock.mock.calls[0][1].headers as Headers).has('X-Access-Token')).toBe(false);
    });

    it('success=false 时抛出服务端的 message', async () => {
      fetchMock.mockResolvedValue(mockResponse({ success: false, code: 500, message: '用户名或密码错误' }));

      await expect(jeecgFetch('/sys/login')).rejects.toThrow('用户名或密码错误');
    });

    it('HTTP 401：清掉令牌并通知登录过期', async () => {
      setToken('old');
      const handler = vi.fn();
      setAuthExpiredHandler(handler);
      fetchMock.mockResolvedValue(mockResponse({ success: false, code: 401, message: 'Token失效' }, { status: 401 }));

      await expect(jeecgFetch('/sys/user/getUserInfo')).rejects.toMatchObject({
        name: 'ApiError',
        status: 401,
      });

      expect(getToken()).toBeNull();
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('网络不通时给出可读的错误', async () => {
      fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

      await expect(jeecgFetch('/sys/login')).rejects.toThrow('网络连接失败');
    });
  });

  describe('coreFetch', () => {
    it('code=0 时返回 data', async () => {
      fetchMock.mockResolvedValue(mockResponse({ code: 0, message: 'success', data: { id: 1 } }));

      expect(await coreFetch<{ id: number }>('/api/v1/audios/1')).toEqual({ id: 1 });
      expect(fetchMock.mock.calls[0][0]).toBe('/kids-ai-core/api/v1/audios/1');
    });

    it('code 非 0 时抛出 message 和 code', async () => {
      fetchMock.mockResolvedValue(mockResponse({ code: 40009, message: '目录下还有音频，不能删除' }));

      const error = (await coreFetch('/api/v1/audio-folders/1', { method: 'DELETE' }).catch(
        (e) => e,
      )) as ApiError;

      expect(error).toBeInstanceOf(ApiError);
      expect(error.message).toBe('目录下还有音频，不能删除');
      expect(error.code).toBe(40009);
    });

    it('成功但没有响应体时返回 undefined', async () => {
      fetchMock.mockResolvedValue(mockResponse(undefined, { status: 204 }));

      expect(await coreFetch('/api/v1/audios/1', { method: 'DELETE' })).toBeUndefined();
    });

    it('响应不是 JSON 时抛出内容片段', async () => {
      fetchMock.mockResolvedValue(mockResponse('<html>502 Bad Gateway</html>', { status: 502 }));

      await expect(coreFetch('/api/v1/audios')).rejects.toThrow('502 Bad Gateway');
    });

    it('Core 不会触发登录过期', async () => {
      const handler = vi.fn();
      setAuthExpiredHandler(handler);
      fetchMock.mockResolvedValue(mockResponse({ code: 401, message: 'x' }, { status: 401 }));

      await expect(coreFetch('/api/v1/audios')).rejects.toThrow('x');
      expect(handler).not.toHaveBeenCalled();
    });
  });

  it('jsonBody 带 JSON 请求头', () => {
    expect(jsonBody({ a: 1 })).toEqual({
      body: '{"a":1}',
      headers: { 'Content-Type': 'application/json' },
    });
  });
});
