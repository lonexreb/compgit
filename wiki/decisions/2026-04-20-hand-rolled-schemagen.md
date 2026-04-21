# 2026-04-20 — Replaced quicktype with a hand-rolled emitter

## Decision

`tools/schemagen/generate.ts` is ~170 lines of TypeScript that parses `compgit.schema.json` and emits TS + Swift directly. No `quicktype-core`.

## Alternatives considered

- **quicktype** (what the plan originally said to use). Well-maintained, many target languages, handles JSON Schema.

## Why not quicktype

In our minimal setup, quicktype either:

- Emitted `Date` types for `format: date-time` fields, which don't survive `JSON.parse` round-trips; we'd have had to strip the format or post-process.
- Generated a duplicate `DayElement` interface alongside `ContributionDay` because it didn't dedupe across separately-named top-level inputs.

Fighting both problems added complexity that outweighed quicktype's generality.

## What hand-rolled buys

- Deterministic, alphabetised output. Every regen produces byte-identical files unless the schema changed.
- Dates stay `string` on the wire; Zod validates shape at runtime in `shared-ts/github/graphql.ts`.
- Swift structs get a memberwise `init` (convenient in tests and widgets) and `Codable + Hashable + Sendable`.
- Enums use `CaseIterable`. Properties get Swift doc comments sourced from `description` fields.

## What it doesn't cover

- Discriminated unions, tuples, anything beyond `string | number | integer | boolean | object | array | $ref`. We'll deal with it when we hit it.
- Runtime validators (we use Zod on the TS side; Swift uses `Codable`).

## When we'd revisit

If the schema grows beyond ~15 types, or if we need a feature (unions, generics) that makes the bespoke emitter fight us, switch back to a proper codegen library.

## Related

- [[../entities/Schema-As-Source-Of-Truth]]
- `tools/schemagen/generate.ts`
