# GitHub GraphQL API

> The single external data source compgit depends on. Contribution data comes from `user.contributionsCollection.contributionCalendar`. All requests go through `packages/shared-ts/src/github/graphql.ts`.

## What we query

```graphql
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
```

And for auth bootstrap:

```graphql
query { viewer { login } }
```

## What we get

`ContributionLevel` is a 5-value enum (`NONE`, `FIRST_QUARTILE`, `SECOND_QUARTILE`, `THIRD_QUARTILE`, `FOURTH_QUARTILE`). `date` is `YYYY-MM-DD` in the user's GitHub-configured timezone (not the browser's). `contributionCount` includes commits, issues, PRs, and code reviews — everything that shows up as a green square on a profile.

## Rate limits

5,000 req/hr authenticated, per user. Compgit's budget:

- One refresh every 15 minutes = 4 req/hr per device.
- Phase 3's comparison tab: +N req per follow on each refresh, where N is the number of followed developers. Concurrency capped at 4.
- No ETags on GraphQL — caching is pure client-side TTL.

## Auth in v1

Fine-grained Personal Access Token with `read:user` scope. Stored in `chrome.storage.local` on-device. Never transmitted to any server other than `api.github.com`.

## What NOT to use

- **Events API** (`/users/:login/events`). 90-day window, 30s–6h latency. Useless for trend history.
- **Search API.** Separate and much smaller rate-limit bucket.
- **REST `/users/:login`.** Useful for avatar URL but not contribution data.

## Phase-5 hour-of-day

When hour-of-day trends ship in Phase 5, they'll use REST `/repos/:owner/:repo/commits?author=&since=` and bucket by `commit.committer.date` — not `commit.author.date`, which can be backdated via `git commit --date`.

## Related

- [[Shared-TypeScript-Core]]
- [[Background-Fetch-Loop]]
- [[compgit]]
- [[OAuth-Worker]] — Phase 4 fronts every GraphQL call with a 1h KV cache to keep us under the 5,000/hr ceiling
- [[Compare-Surface]] — Phase 3's parallel-fetch-with-cap-of-4 aggregator that this rate-limit math gates

## Sources

- <https://docs.github.com/en/graphql/reference/objects#contributionscollection>
- <https://docs.github.com/en/graphql/overview/resource-limitations>
- <https://docs.github.com/en/rest/activity/events>
