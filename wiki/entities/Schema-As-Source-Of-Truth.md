# Schema as Source of Truth

> A single `compgit.schema.json` is the canonical data model. A bespoke generator emits TypeScript and Swift types from it. Hand-editing the generated files is forbidden; CI fails on drift.

## What

The file `packages/schema/compgit.schema.json` defines three types under `definitions`:

- `ContributionLevel` — enum: `NONE | FIRST_QUARTILE | SECOND_QUARTILE | THIRD_QUARTILE | FOURTH_QUARTILE`.
- `ContributionDay` — a single calendar date with a count and a level.
- `ContributionsCollection` — a windowed snapshot of a user's contribution calendar (login, from, to, total, days[], fetchedAt).
- `FollowedDeveloper` — a tracked user for the comparison tab (login, displayName, avatarUrl, addedAt).

`tools/schemagen/generate.ts` reads the schema and emits:

- `packages/shared-ts/src/generated.ts`
- `packages/shared-swift/Sources/CompgitSchema/Generated.swift`

Run `pnpm gen:schema` after any schema edit. CI runs `pnpm check:schema-drift`, which fails if the emitted files differ from HEAD.

## Why

Duplicate models drift within weeks. The Chrome popup would start reading a field the Swift widget doesn't write, and you'd ship a silent data bug across a network you can't inspect. Codegen from one source of truth makes this class of bug structurally impossible.

JSON Schema specifically — and not TypeScript types or Swift structs as the canonical form — because it is:

1. Language-agnostic (ships Zod-like runtime validation too, if needed later).
2. Human-readable diff target.
3. Supported by many generators even if we swap the emitter.

## How it works

The emitter is ~170 LoC, intentionally not using `quicktype-core`. — [[../decisions/2026-04-20-hand-rolled-schemagen]]

Flow:

1. Parse the schema JSON.
2. Order definitions: enums first, then objects; alphabetical within each group for deterministic diffs.
3. For each definition:
   - TS: `export interface X` or `export type X = "a" | "b"`.
   - Swift: `public struct X: Codable, Hashable, Sendable` with a memberwise init, or `public enum X: String, Codable, CaseIterable, Sendable`.
4. Prepend an identical banner to both outputs so it's obvious they're generated.
5. Write.

Properties are alphabetised within each struct to keep diffs stable; required vs optional handled per JSON Schema.

## Trade-offs

- **No formats.** We dropped `format: date-time` because quicktype used to map it to `Date`, and dates are safer on the wire as strings. Validation of shape happens at runtime via Zod (in `shared-ts/src/github/graphql.ts`); date semantics are enforced by downstream consumers.
- **Single file.** The schema is one file with `definitions`, not one file per type. Cross-refs (`#/definitions/ContributionDay`) are resolved by the emitter without fetching. — [[../decisions/2026-04-20-merged-schema]]
- **Emitter is bespoke.** If we ever outgrow it (GraphQL-like schemas, discriminated unions), we'd consider going back to a real codegen library.

## Related

- [[../decisions/2026-04-20-hand-rolled-schemagen]]
- [[../decisions/2026-04-20-merged-schema]]
- [[Shared-TypeScript-Core]]

## Sources

- JSON Schema draft-07: <https://json-schema.org/draft-07/schema>
- Emitter: `tools/schemagen/generate.ts`
