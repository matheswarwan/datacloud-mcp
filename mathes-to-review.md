# Mathes To Review

A running list of things to revisit when time permits.

---

## npm Vulnerabilities (as of 2026-03-15)

Found via `npm audit`. All 5 are in **devDependencies** (Cloudflare Workers tooling — `wrangler`, `miniflare`), so they do **not** affect end users of the npm package.

| Severity | Package | Issue | Advisory |
|---|---|---|---|
| Moderate | `esbuild <=0.24.2` | Any website can send requests to the dev server and read responses | [GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99) |
| Moderate | `wrangler <=4.24.3` | Depends on vulnerable esbuild + miniflare | — |
| Moderate | `hono <4.12.7` | Prototype Pollution via `parseBody({ dot: true })` | [GHSA-v8w9-8mx6-g223](https://github.com/advisories/GHSA-v8w9-8mx6-g223) |
| High | `undici <=6.23.0` | Unbounded decompression, HTTP smuggling, WebSocket memory consumption, CRLF injection | [GHSA-g9mf-h72j-4rw9](https://github.com/advisories/GHSA-g9mf-h72j-4rw9) and others |
| Moderate | `miniflare` | Depends on vulnerable undici | — |

### Fix options

- **Safe fix** (no breaking changes): `npm audit fix` — fixes `hono`
- **Full fix** (breaking change): `npm audit fix --force` — upgrades `wrangler` to `v4.73.0`, which may require testing the Cloudflare Worker setup (`src/worker.ts`, `wrangler.toml`)

### Action needed
- [ ] Run `npm audit fix` for the hono fix (safe, non-breaking)
- [ ] Test and upgrade `wrangler` to `v4.73.0` when ready to work on the Cloudflare Worker deployment

---

