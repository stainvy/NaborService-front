import { describe, it, expect, beforeEach } from 'vitest';
import { env } from './env';
import { mediaUrl } from './media';
import { clearAccessToken, setAccessToken } from './tokenStore';

describe('mediaUrl', () => {
  beforeEach(() => clearAccessToken());

  it('returns null without a media id', () => {
    expect(mediaUrl(null)).toBeNull();
    expect(mediaUrl(undefined)).toBeNull();
  });

  it('appends ?token= when an access token is present (the stream endpoint requires it)', () => {
    setAccessToken('jwt-de-test');
    expect(mediaUrl('abc123')).toBe(`${env.apiUrl}/media/abc123/stream?token=jwt-de-test`);
  });

  it('returns the bare URL when there is no access token', () => {
    expect(mediaUrl('abc123')).toBe(`${env.apiUrl}/media/abc123/stream`);
  });
});
