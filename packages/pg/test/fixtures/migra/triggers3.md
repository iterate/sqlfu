# Migra fixture: triggers3

Lifted from `pgkit/packages/migra/test/fixtures/triggers3/`.

## triggers3

<details data-skip="pg_get_viewdef qualifies columns differently across pg versions">
<summary>input</summary>

```sql (a.sql)
CREATE TABLE "my_table" (
    "some_text" text,
    "some_count" int
);

CREATE VIEW "view_on_table" AS
SELECT some_text, some_count FROM my_table;

CREATE OR REPLACE FUNCTION my_function()
    RETURNS trigger
    LANGUAGE plpgsql
AS $function$
    BEGIN
        INSERT INTO my_table (some_text)
        VALUES (NEW.some_text);
        RETURN NEW;
    END;
$function$
;

CREATE TRIGGER trigger_on_view INSTEAD OF
INSERT ON view_on_table
FOR EACH ROW EXECUTE PROCEDURE my_function();
;

INSERT INTO view_on_table VALUES ('this is a test');
```

```sql (b.sql)


CREATE TABLE "my_table" (
    "some_text" text,
    "some_date" timestamp,
    "some_count" int
);

CREATE VIEW "view_on_table" AS
SELECT some_text, some_date, some_count FROM my_table;

CREATE OR REPLACE FUNCTION my_function()
    RETURNS trigger
    LANGUAGE plpgsql
AS $function$
    BEGIN
        INSERT INTO my_table (some_text)
        VALUES (NEW.some_text);
        RETURN NEW;
    END;
$function$
;

CREATE TRIGGER trigger_on_view INSTEAD OF
INSERT ON view_on_table
FOR EACH ROW EXECUTE PROCEDURE my_function();
;
```

</details>

<details>
<summary>output</summary>

```sql (expected.sql)
drop trigger if exists "trigger_on_view" on "public"."view_on_table";

drop view if exists "public"."view_on_table";

alter table "public"."my_table" add column "some_date" timestamp without time zone;

create or replace view "public"."view_on_table" as  SELECT my_table.some_text,
    my_table.some_date,
    my_table.some_count
   FROM my_table;


CREATE TRIGGER trigger_on_view INSTEAD OF INSERT ON public.view_on_table FOR EACH ROW EXECUTE FUNCTION my_function();
```

</details>
