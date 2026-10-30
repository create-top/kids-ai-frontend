import { describe, expect, it } from 'vitest';
import { getSafeRedirectUrl } from './redirect';

const ORIGIN = 'http://localhost:8000';

describe('getSafeRedirectUrl', () => {
  it('同源相对路径原样保留，带上查询串和锚点', () => {
    expect(getSafeRedirectUrl('/audio?x=1#a', ORIGIN)).toBe('/audio?x=1#a');
  });

  it('空值回到首页', () => {
    expect(getSafeRedirectUrl(null, ORIGIN)).toBe('/');
    expect(getSafeRedirectUrl('', ORIGIN)).toBe('/');
  });

  it('外部地址一律回到首页', () => {
    expect(getSafeRedirectUrl('https://evil.example.com', ORIGIN)).toBe('/');
    expect(getSafeRedirectUrl('//evil.example.com/x', ORIGIN)).toBe('/');
    expect(getSafeRedirectUrl('audio', ORIGIN)).toBe('/');
  });

  it('反斜杠绕过也回到首页', () => {
    expect(getSafeRedirectUrl('/\\evil.example.com', ORIGIN)).toBe('/');
  });
});
