# Migra fixture: triggers

Lifted from `pgkit/packages/migra/test/fixtures/triggers/`.

## triggers

<details>
<summary>input</summary>

```sql (a.sql)
CREATE TABLE emp (
    empname text,
    salary integer,
    last_date timestamp,
    last_user text
);

CREATE FUNCTION emp_stamp() RETURNS trigger AS $emp_stamp$
    BEGIN
        -- Check that empname and salary are given
        IF NEW.empname IS NULL THEN
            RAISE EXCEPTION 'empname cannot be null';
        END IF;
        IF NEW.salary IS NULL THEN
            RAISE EXCEPTION '% cannot have null salary', NEW.empname;
        END IF;

        -- Who works for us when they must pay for it?
        IF NEW.salary < 0 THEN
            RAISE EXCEPTION '% cannot have a negative salary', NEW.empname;
        END IF;

        -- Remember who changed the payroll when
        NEW.last_date := current_timestamp;
        NEW.last_user := current_user;
        RETURN NEW;
    END;
$emp_stamp$ LANGUAGE plpgsql;

CREATE TRIGGER emp_stamp BEFORE INSERT OR UPDATE ON emp
    FOR EACH ROW EXECUTE PROCEDURE emp_stamp();

CREATE TRIGGER emp_stamp_drop BEFORE INSERT OR UPDATE ON emp
        FOR EACH ROW EXECUTE PROCEDURE emp_stamp();
```

```sql (b.sql)
CREATE TABLE emp (
    empname text,
    salary integer,
    last_date timestamp,
    last_user text
);

CREATE FUNCTION emp_stamp() RETURNS trigger AS $emp_stamp$
    BEGIN
        -- Check that empname and salary are given
        IF NEW.empname IS NULL THEN
            RAISE EXCEPTION 'empname cannot be null';
        END IF;
        IF NEW.salary IS NULL THEN
            RAISE EXCEPTION '% cannot have null salary', NEW.empname;
        END IF;

        -- Who works for us when they must pay for it?
        IF NEW.salary < 0 THEN
            RAISE EXCEPTION '% cannot have a negative salary', NEW.empname;
        END IF;

        -- Remember who changed the payroll when
        NEW.last_date := current_timestamp;
        NEW.last_user := current_user;
        RETURN NEW;
    END;
$emp_stamp$ LANGUAGE plpgsql;

CREATE TRIGGER emp_stamp BEFORE UPDATE ON emp
    FOR EACH ROW EXECUTE PROCEDURE emp_stamp();

CREATE TRIGGER emp_stamp_create BEFORE INSERT OR UPDATE ON emp
            FOR EACH ROW EXECUTE PROCEDURE emp_stamp();
```

</details>

<details>
<summary>output</summary>

```sql (expected.sql)
drop trigger if exists "emp_stamp_drop" on "public"."emp";

drop trigger if exists "emp_stamp" on "public"."emp";

CREATE TRIGGER emp_stamp_create BEFORE INSERT OR UPDATE ON public.emp FOR EACH ROW EXECUTE FUNCTION emp_stamp();

CREATE TRIGGER emp_stamp BEFORE UPDATE ON public.emp FOR EACH ROW EXECUTE FUNCTION emp_stamp();
```

</details>
