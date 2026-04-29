import { describe, expect, it } from 'vitest';
import { AuthError, NetworkError, RateLimitError, ValidationError } from './errors';
import { type FetchLike, fetchContributionsCollection, fetchViewerLogin } from './graphql';

function mockFetch(
  handler: (input: string, init: RequestInit) => Response | Promise<Response>,
): FetchLike {
  return async (input, init) => handler(input, init);
}

function okJson(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

const happyCalendar = {
  data: {
    user: {
      contributionsCollection: {
        totalContributions: 12,
        contributionCalendar: {
          weeks: [
            {
              contributionDays: [
                { contributionCount: 0, date: '2026-04-13', contributionLevel: 'NONE' },
                {
                  contributionCount: 5,
                  date: '2026-04-14',
                  contributionLevel: 'SECOND_QUARTILE',
                },
                {
                  contributionCount: 7,
                  date: '2026-04-15',
                  contributionLevel: 'THIRD_QUARTILE',
                },
              ],
            },
          ],
        },
      },
    },
  },
};

describe('fetchContributionsCollection', () => {
  it('flattens weeks → sorted days and fills a ContributionsCollection', async () => {
    const fetchImpl = mockFetch((input) => {
      expect(input).toBe('https://api.github.com/graphql');
      return okJson(happyCalendar);
    });
    const now = () => new Date('2026-04-20T13:46:00Z');
    const result = await fetchContributionsCollection({
      login: 'torvalds',
      from: '2026-04-13T00:00:00Z',
      to: '2026-04-20T23:59:59Z',
      token: 'ghp_test',
      fetchImpl,
      now,
    });
    expect(result.login).toBe('torvalds');
    expect(result.totalContributions).toBe(12);
    expect(result.days).toHaveLength(3);
    expect(result.days[0]!.date).toBe('2026-04-13');
    expect(result.fetchedAt).toBe('2026-04-20T13:46:00.000Z');
  });

  it('throws AuthError on 401', async () => {
    const fetchImpl = mockFetch(() => new Response('{}', { status: 401 }));
    await expect(
      fetchContributionsCollection({
        login: 't',
        from: 'a',
        to: 'b',
        token: 'bad',
        fetchImpl,
      }),
    ).rejects.toBeInstanceOf(AuthError);
  });

  it('throws RateLimitError on 403 with resetAt', async () => {
    const resetUnix = Math.floor(Date.now() / 1000) + 60;
    const fetchImpl = mockFetch(
      () =>
        new Response('{}', {
          status: 403,
          headers: { 'x-ratelimit-reset': String(resetUnix) },
        }),
    );
    try {
      await fetchContributionsCollection({
        login: 't',
        from: 'a',
        to: 'b',
        token: 'ok',
        fetchImpl,
      });
      expect.fail('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(RateLimitError);
      expect((error as RateLimitError).resetAt.getTime()).toBe(resetUnix * 1000);
    }
  });

  it('throws NetworkError when fetch rejects', async () => {
    const fetchImpl: FetchLike = async () => {
      throw new Error('offline');
    };
    await expect(
      fetchContributionsCollection({
        login: 't',
        from: 'a',
        to: 'b',
        token: 'ok',
        fetchImpl,
      }),
    ).rejects.toBeInstanceOf(NetworkError);
  });

  it('throws ValidationError on malformed JSON', async () => {
    const fetchImpl = mockFetch(() => okJson({ weird: true }));
    await expect(
      fetchContributionsCollection({
        login: 't',
        from: 'a',
        to: 'b',
        token: 'ok',
        fetchImpl,
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('surfaces GraphQL errors as ValidationError', async () => {
    const fetchImpl = mockFetch(() =>
      okJson({
        data: null,
        errors: [{ message: 'Could not resolve to a User' }],
      }),
    );
    await expect(
      fetchContributionsCollection({
        login: 'ghost',
        from: 'a',
        to: 'b',
        token: 'ok',
        fetchImpl,
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('honors a custom baseURL when provided (Phase 4: Worker proxy)', async () => {
    let calledWith = '';
    const fetchImpl = mockFetch((input) => {
      calledWith = input;
      return okJson(happyCalendar);
    });
    await fetchContributionsCollection({
      login: 'torvalds',
      from: '2026-04-13T00:00:00Z',
      to: '2026-04-20T23:59:59Z',
      token: 'ghp_test',
      fetchImpl,
      baseURL: 'https://api.compgit.example/contributions',
    });
    expect(calledWith).toBe('https://api.compgit.example/contributions');
  });
});

describe('fetchViewerLogin', () => {
  it('returns the viewer login on success', async () => {
    const fetchImpl = mockFetch(() => okJson({ data: { viewer: { login: 'torvalds' } } }));
    expect(await fetchViewerLogin('ghp_test', fetchImpl)).toBe('torvalds');
  });

  it('throws AuthError on 401', async () => {
    const fetchImpl = mockFetch(() => new Response('{}', { status: 401 }));
    await expect(fetchViewerLogin('bad', fetchImpl)).rejects.toBeInstanceOf(AuthError);
  });

  it('honors a custom baseURL when provided', async () => {
    let calledWith = '';
    const fetchImpl = mockFetch((input) => {
      calledWith = input;
      return okJson({ data: { viewer: { login: 'torvalds' } } });
    });
    await fetchViewerLogin('ghp_test', fetchImpl, 'https://api.compgit.example/me');
    expect(calledWith).toBe('https://api.compgit.example/me');
  });
});
