---
status: in-progress
size: small
---

# Link to the introductory blog post from the homepage and README

> Status: spec committed, implementation next. Small task — two link placements.

The introductory blog post ([introducing sqlfu](https://sqlfu.dev/blog/introducing-sqlfu), `website/src/content/blog/introducing-sqlfu.md`) is the best "why does this exist" narrative we have, but nothing links to it from the two highest-traffic entry points: the landing page and the package README. Fix that.

- [ ] Homepage (`website/src/pages/index.astro`): add a link to `/blog/introducing-sqlfu` in the hero area, as a low-key text link alongside/below the existing CTA buttons (`Start tutorial` / `Try in browser`). It should read like editorial copy ("read the introductory post"), not a third button competing with the CTAs.
- [ ] README (`packages/sqlfu/README.md`): extend the existing "**New to sqlfu?**" line (or add an adjacent sentence) pointing to the blog post for the story/motivation, complementing the Getting Started link which covers the how-to. Root `README.md` regenerates from this via the pre-commit hook — don't edit it directly.

## Assumptions (made on Misha's behalf)

- "The homepage" means the landing page hero, not the site nav. A nav `Blog` item linking to `/blog` may be worth doing too, but it's a different ask (blog index vs intro post) — left out of scope.
- Use the relative URL `/blog/introducing-sqlfu` on the website, and the absolute `https://sqlfu.dev/blog/introducing-sqlfu` in the README (read on GitHub/npm, so it needs the full URL).

## Implementation log

(notes added during implementation)
