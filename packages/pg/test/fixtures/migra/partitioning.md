# Migra fixture: partitioning

Lifted from `pgkit/packages/migra/test/fixtures/partitioning/`.

## partitioning

<details>
<summary>input</summary>

```sql (a.sql)
CREATE TABLE measurement (
    city_id         int not null,
    logdate         date not null,
    peaktemp        int,
    unitsales       int
) PARTITION BY RANGE (logdate);

CREATE TABLE measurement_y2006m02 PARTITION OF measurement
    FOR VALUES FROM ('2006-02-01') TO ('2006-03-01');

CREATE TABLE measurement_y2006m03 PARTITION OF measurement
    FOR VALUES FROM ('2006-03-01') TO ('2006-04-01');

CREATE INDEX ON measurement_y2006m02 (logdate);

CREATE TABLE reg2partitioned( city_id int not null, logdate date not null, peaktemp int, unitsales int);

CREATE TABLE partitioned2reg( city_id int not null, logdate date not null, peaktemp int, unitsales int ) PARTITION BY RANGE (logdate);
```

```sql (b.sql)
CREATE TABLE measurement (
    city_id         int not null,
    logdate         date not null,
    peaktemp        int,
    unitsales       int,
    extra           text
) PARTITION BY RANGE (logdate);

CREATE TABLE measurement_y2005m02 PARTITION OF measurement
    FOR VALUES FROM ('2005-02-01') TO ('2005-03-01');

CREATE TABLE measurement_y2006m02 PARTITION OF measurement
    FOR VALUES FROM ('2006-02-01') TO ('2006-03-01');

CREATE TABLE measurement_y2006m03 (
    city_id         int not null,
    logdate         date not null,
    peaktemp        int,
    unitsales       int
);

CREATE TABLE reg2partitioned( city_id int not null, logdate date not null, peaktemp int, unitsales int) PARTITION BY RANGE (logdate);

CREATE TABLE partitioned2reg( city_id int not null, logdate date not null, peaktemp int, unitsales int);
```

</details>

<details>
<summary>output</summary>

```sql (expected.sql)
drop index if exists "public"."measurement_y2006m02_logdate_idx";

create table "public"."measurement_y2005m02" partition of "public"."measurement" FOR VALUES FROM ('2005-02-01') TO ('2005-03-01');


alter table "public"."measurement" detach partition "public"."measurement_y2006m03";

drop table "public"."partitioned2reg";

create table "public"."partitioned2reg" (
    "city_id" integer not null,
    "logdate" date not null,
    "peaktemp" integer,
    "unitsales" integer
);


drop table "public"."reg2partitioned";

create table "public"."reg2partitioned" (
    "city_id" integer not null,
    "logdate" date not null,
    "peaktemp" integer,
    "unitsales" integer
) partition by RANGE (logdate);


alter table "public"."measurement" add column "extra" text;
```

</details>
