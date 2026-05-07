# Migra fixture: rls

Lifted from `pgkit/packages/migra/test/fixtures/rls/`.

## rls

<details>
<summary>input</summary>

```sql (a.sql)
CREATE TABLE accounts (manager text, company text, contact_email text);

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY account_managers ON accounts TO schemainspect_test_role
    USING (manager = current_user);

CREATE TABLE accounts2 (manager text, company text, contact_email text);
```

```sql (b.sql)
CREATE TABLE accounts (manager text, company text, contact_email text);

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY account_managers ON accounts as restrictive TO schemainspect_test_role
    USING (manager = current_user);

CREATE TABLE accounts2 (manager text, company text, contact_email text);

ALTER TABLE accounts2 ENABLE ROW LEVEL SECURITY;
```

</details>

<details>
<summary>output</summary>

```sql (expected.sql)
drop policy "account_managers" on "public"."accounts";
alter table "public"."accounts2" enable row level security;
create policy "account_managers"
  on "public"."accounts"
  as restrictive
  for all
  to schemainspect_test_role
using ((manager = CURRENT_USER));
```

</details>
