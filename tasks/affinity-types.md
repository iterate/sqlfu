a bit of a kooky idea here.

what if we took advantage of sqlite's "affinity" concept https://www.sqlite.org/datatype3.html

we could maybe encourage writing something like `create table webhooks(type text, payload json)`
even though `json` isn't a data type in sqlite. but at typegen-time we could probably have certain rules about how it's handled, which could be configurable one day.

so like in the above example we'd call `JSON.stringify(payload)` before passing as a parameter and maybe `JSON.parse(payload)` on the way out

could even have a special table like

```sql
create table sqlfu_types(
    github_webhook text default '{ action: "push" | "pull_request" }',
    slack_webhook text default '{ type: "message" }'
)
```

and from then on if you do something like `create table slack_webhooks(type text, payload slack_webhook)` it could then "look up" in the DDL for the table itself that type and use the default value for the generated typescript.

I think that last idea is a bit far fetched probably. Maybe worth a side-track? I dunno.

But using/abusing the fact that `json` acts like `blob` seems useful!
