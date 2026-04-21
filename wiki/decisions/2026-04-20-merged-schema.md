# 2026-04-20 — Merged schema into one file with `definitions`

## Decision

`packages/schema/compgit.schema.json` is a single file with `definitions` (ContributionDay, ContributionLevel, ContributionsCollection, FollowedDeveloper). Not three separate schema files.

## Alternatives considered

- **Three files** (`contribution-day.schema.json`, `contributions-collection.schema.json`, `followed-developer.schema.json`) with `$ref` resolving across files. Matched the original plan; had the advantage of each type being its own artefact.

## Why merged

- Cross-file `$ref` resolution needs a schema store with URIs. Works with quicktype if set up carefully, but every new type becomes a new file + store entry.
- With a single file, `#/definitions/<Name>` refs are local and trivial.
- The models are small (four types). The physical separation didn't buy anything.

## Trade-offs

- If we ever need to publish one type without the others as a standalone contract, we'd split. Not a concern for a monorepo with one publisher.

## Related

- [[../entities/Schema-As-Source-Of-Truth]]
- [[2026-04-20-hand-rolled-schemagen]]
