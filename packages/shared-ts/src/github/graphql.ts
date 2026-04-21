import { z } from 'zod';
import type { ContributionDay, ContributionsCollection } from '../generated';
import { AuthError, NetworkError, RateLimitError, ValidationError } from './errors';

const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';

const CONTRIBUTIONS_QUERY = /* GraphQL */ `
  query GetContributionCalendar($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        totalContributions
        contributionCalendar {
          totalWeeks
          weeks {
            contributionDays {
              contributionCount
              date
              contributionLevel
            }
          }
        }
      }
    }
  }
`;

const VIEWER_QUERY = /* GraphQL */ `
  query {
    viewer {
      login
    }
  }
`;

const contributionDaySchema = z.object({
  contributionCount: z.number().int().nonnegative(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  contributionLevel: z.enum([
    'NONE',
    'FIRST_QUARTILE',
    'SECOND_QUARTILE',
    'THIRD_QUARTILE',
    'FOURTH_QUARTILE',
  ]),
});

const contributionsResponseSchema = z.object({
  data: z
    .object({
      user: z.object({
        contributionsCollection: z.object({
          totalContributions: z.number().int().nonnegative(),
          contributionCalendar: z.object({
            weeks: z.array(
              z.object({
                contributionDays: z.array(contributionDaySchema),
              }),
            ),
          }),
        }),
      }),
    })
    .nullable(),
  errors: z.array(z.object({ message: z.string(), type: z.string().optional() })).optional(),
});

const viewerResponseSchema = z.object({
  data: z
    .object({
      viewer: z.object({ login: z.string().min(1) }),
    })
    .nullable(),
  errors: z.array(z.object({ message: z.string(), type: z.string().optional() })).optional(),
});

export type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

interface PostOptions {
  token: string;
  fetchImpl?: FetchLike;
}

async function postGraphQL(
  body: object,
  { token, fetchImpl = fetch }: PostOptions,
): Promise<Response> {
  let response: Response;
  try {
    response = await fetchImpl(GITHUB_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github+json',
        'User-Agent': 'compgit/0.0.0',
      },
      body: JSON.stringify(body),
    });
  } catch (error: unknown) {
    throw new NetworkError('GitHub request failed to dispatch', error);
  }
  if (response.status === 401) {
    throw new AuthError('GitHub rejected the token (401 Unauthorized)');
  }
  if (response.status === 403 || response.status === 429) {
    const resetHeader = response.headers.get('x-ratelimit-reset');
    const resetAt = resetHeader
      ? new Date(Number.parseInt(resetHeader, 10) * 1000)
      : new Date(Date.now() + 60_000);
    throw new RateLimitError(
      `GitHub rate limit exceeded; resets at ${resetAt.toISOString()}`,
      resetAt,
    );
  }
  if (!response.ok) {
    throw new NetworkError(`GitHub returned HTTP ${response.status}`);
  }
  return response;
}

export interface FetchContributionsArgs {
  login: string;
  from: string;
  to: string;
  token: string;
  fetchImpl?: FetchLike;
  now?: () => Date;
}

export async function fetchContributionsCollection(
  args: FetchContributionsArgs,
): Promise<ContributionsCollection> {
  const response = await postGraphQL(
    {
      query: CONTRIBUTIONS_QUERY,
      variables: { login: args.login, from: args.from, to: args.to },
    },
    { token: args.token, ...(args.fetchImpl ? { fetchImpl: args.fetchImpl } : {}) },
  );
  const json: unknown = await response.json();
  const parsed = contributionsResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new ValidationError('Unexpected GraphQL response shape', parsed.error.format());
  }
  if (parsed.data.errors && parsed.data.errors.length > 0) {
    throw new ValidationError(
      parsed.data.errors.map((e) => e.message).join('; '),
      parsed.data.errors,
    );
  }
  if (!parsed.data.data) {
    throw new ValidationError('GraphQL response missing `data`', parsed.data);
  }
  const collection = parsed.data.data.user.contributionsCollection;
  const days: ContributionDay[] = collection.contributionCalendar.weeks
    .flatMap((week) => week.contributionDays)
    .sort((a, b) => a.date.localeCompare(b.date));
  const fetchedAt = (args.now ?? (() => new Date()))().toISOString();
  return {
    login: args.login,
    from: args.from,
    to: args.to,
    totalContributions: collection.totalContributions,
    days,
    fetchedAt,
  };
}

export async function fetchViewerLogin(token: string, fetchImpl?: FetchLike): Promise<string> {
  const response = await postGraphQL(
    { query: VIEWER_QUERY },
    { token, ...(fetchImpl ? { fetchImpl } : {}) },
  );
  const json: unknown = await response.json();
  const parsed = viewerResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new ValidationError('Unexpected viewer response shape', parsed.error.format());
  }
  if (parsed.data.errors && parsed.data.errors.length > 0) {
    throw new AuthError(parsed.data.errors.map((e) => e.message).join('; '));
  }
  if (!parsed.data.data) {
    throw new AuthError('GraphQL response missing viewer');
  }
  return parsed.data.data.viewer.login;
}
