# Draft

## definitions.sql

```sql artifact=definitions
create table posts (
  id integer primary key autoincrement,
  slug text not null unique,
  title text not null
+ published integer {diff-add speed=schema-add reveal-pause=620 hide-typing-whitespace});
```

## terminal

```term artifact=terminal
$ npx sqlfu draft {speed=command run-command}
│ {terminal-output=prompt output-pause=1450}
◇  Create migration file? ─────────────────╮ {terminal-output=prompt}
│                                          │ {terminal-output=prompt}
│  alter table posts                       │ {terminal-output=prompt}
│  add column published integer;           │ {terminal-output=prompt}
│                                          │ {terminal-output=prompt}
├──────────────────────────────────────────╯ {terminal-output=prompt corner-before-next}
╰──────────────────────────────────────────╯ {terminal-output=prompt corner-after-next}
│ {terminal-output=prompt dismiss-before-next}
◆  Continue with this body? {terminal-output=prompt dismiss-before-next}
│  ● Yes {terminal-output=prompt dismiss-before-next}
│  ○ No {terminal-output=prompt dismiss-before-next}
│  ○ Edit with code {terminal-output=prompt dismiss-before-next}
│  ○ Edit with vi {terminal-output=prompt dismiss-before-next}
│  ○ Edit with nano {terminal-output=prompt dismiss-before-next}
Wrote migrations/00002_add_published_to_posts.sql {terminal-output=wrote output-pause=0}
```
