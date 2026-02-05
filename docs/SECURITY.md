# Security notes (dev repo)

## Frontend dependency advisories (Next.js)

`npm audit` currently reports high-severity advisories against `next` for versions `10.0.0 - 15.5.9`.

This repo is **local-dev only (v0)** right now (no public hosting), and we do **not** use the Image Optimizer remotePatterns feature.

When we move toward any kind of public/self-hosted deployment, we should:

- Upgrade Next.js to a fixed version (likely Next 16+ at the time of writing), and
- Add a simple production hardening checklist (CSP, rate limiting, etc.)

Reference advisories:
- GHSA-9g9p-9gw9-jx7f
- GHSA-h25m-26qc-wcjf
