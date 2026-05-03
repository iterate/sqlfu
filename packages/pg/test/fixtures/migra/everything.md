# Migra fixture: everything

Lifted from `pgkit/packages/migra/test/fixtures/everything/`.

## everything

<details>
<summary>input</summary>

```sql (a.sql)
create extension pg_trgm;

create schema goodschema;
create schema badschema;

CREATE TYPE shipping_status AS ENUM ('not shipped', 'shipped');

CREATE TYPE unwanted_enum AS ENUM ('unwanted', 'not wanted');

CREATE TYPE unused_enum AS ENUM ('a', 'b');

CREATE TYPE usage_dropped_enum AS ENUM ('x', 'y');

create table columnless_table();

create unlogged table change_to_logged();

create table change_to_unlogged();

CREATE TABLE aunwanted (
    id serial primary key,
    name text not null
);

CREATE TABLE orders (
    order_id serial primary key,
    shipping_address text,
    status shipping_status,
    status2 usage_dropped_enum
);

CREATE TABLE products (
    product_no integer,
    name varchar(10) not null unique,
    price numeric,
    x integer not null default 7 unique,
    oldcolumn text,
    constraint x check (price > 0),
    z integer REFERENCES orders ON DELETE CASCADE,
    zz integer REFERENCES aunwanted ON DELETE CASCADE
);

create unique index on products(x);

create unique index on orders(order_id);

create index on products(price);

create view vvv as select * from products;

create materialized view matvvv as select * from products;

grant select, insert on table products to postgres;

create or replace function public.changed(i integer, t text[])
returns TABLE(a text, c integer) as
$$
 declare
        BEGIN
                select 'no', 1;
        END;

$$
LANGUAGE PLPGSQL STABLE returns null on null input security definer;
```

```sql (b.sql)
create extension hstore;
create extension citext;

create schema goodschema;
create schema evenbetterschema;

CREATE TYPE shipping_status AS ENUM ('not shipped', 'shipped', 'delivered');

CREATE TYPE bug_status AS ENUM ('new', 'open', 'closed');

CREATE TYPE unused_enum AS ENUM ('a', 'b', 'c');

CREATE TYPE usage_dropped_enum AS ENUM ('x', 'y');

create table columnless_table2();

create table change_to_logged();

create unlogged table change_to_unlogged();

CREATE TABLE products (
    product_no serial primary key,
    name text,
    price numeric not null default 100,
    x integer,
    newcolumn text,
    newcolumn2 interval,
    constraint x check (price > 10),
    constraint y check (price > 0)
);

create index on products(name);

grant update, insert on table products to postgres;

CREATE TABLE orders (
    order_id integer primary key unique,
    shipping_address text,
    status shipping_status,
    status2 text,
    h hstore
);

CREATE TABLE order_items (
    product_no integer REFERENCES products ON DELETE RESTRICT,
    order_id integer REFERENCES orders ON DELETE CASCADE,
    quantity integer,
    PRIMARY KEY (product_no, order_id)
);

create or replace function public.changed(i integer, t text[])
returns TABLE(a text, c integer) as
$$
 declare
        BEGIN
                select 'no', 1;
        END;

$$
LANGUAGE PLPGSQL volatile returns null on null input security definer;

create or replace function public.newfunc(i integer, t text[])
returns TABLE(a text, c integer) as
$$
 declare
        BEGIN
                select 'no', 1;
        END;

$$
LANGUAGE PLPGSQL STABLE returns null on null input security invoker;

create view vvv as select 2 as a;

create materialized view matvvv as select 2 as a;

CREATE TABLE bug (
    id serial,
    description text,
    status text-- bug_status
);
```

</details>

<details>
<summary>output</summary>

```sql (expected.sql)
create schema if not exists "evenbetterschema";
create extension if not exists "citext" with schema "public";
create extension if not exists "hstore" with schema "public";
create type "public"."bug_status" as enum ('new', 'open', 'closed');
create sequence "public"."bug_id_seq";
create sequence "public"."products_product_no_seq";
alter table "public"."products" drop constraint "products_name_key";
alter table "public"."products" drop constraint "products_x_key";
alter table "public"."products" drop constraint "products_z_fkey";
alter table "public"."products" drop constraint "products_zz_fkey";
alter table "public"."products" drop constraint "x";
drop materialized view if exists "public"."matvvv";
drop view if exists "public"."vvv";
alter table "public"."aunwanted" drop constraint "aunwanted_pkey";
drop index if exists "public"."aunwanted_pkey";
drop index if exists "public"."orders_order_id_idx";
drop index if exists "public"."products_name_key";
drop index if exists "public"."products_price_idx";
drop index if exists "public"."products_x_idx";
drop index if exists "public"."products_x_key";
drop table "public"."aunwanted";
drop table "public"."columnless_table";
alter type "public"."shipping_status" rename to "shipping_status__old_version_to_be_dropped";
create type "public"."shipping_status" as enum ('not shipped', 'shipped', 'delivered');
alter type "public"."unused_enum" rename to "unused_enum__old_version_to_be_dropped";
create type "public"."unused_enum" as enum ('a', 'b', 'c');
create table "public"."bug" (
    "id" integer not null default nextval('bug_id_seq'::regclass),
    "description" text,
    "status" text
      );
create table "public"."columnless_table2" (
      );
create table "public"."order_items" (
    "product_no" integer not null,
    "order_id" integer not null,
    "quantity" integer
      );
alter table "public"."orders" alter column status type "public"."shipping_status" using status::text::"public"."shipping_status";
drop type "public"."shipping_status__old_version_to_be_dropped";
drop type "public"."unused_enum__old_version_to_be_dropped";
alter table "public"."change_to_logged" set logged;
alter table "public"."change_to_unlogged" set unlogged;
alter table "public"."orders" add column "h" hstore;
alter table "public"."orders" alter column "order_id" drop default;
alter table "public"."orders" alter column "status2" set data type text using "status2"::text;
alter table "public"."products" drop column "oldcolumn";
alter table "public"."products" drop column "z";
alter table "public"."products" drop column "zz";
alter table "public"."products" add column "newcolumn" text;
alter table "public"."products" add column "newcolumn2" interval;
alter table "public"."products" alter column "name" drop not null;
alter table "public"."products" alter column "name" set data type text using "name"::text;
alter table "public"."products" alter column "price" set default 100;
alter table "public"."products" alter column "price" set not null;
alter table "public"."products" alter column "product_no" set default nextval('products_product_no_seq'::regclass);
alter table "public"."products" alter column "product_no" set not null;
alter table "public"."products" alter column "x" drop default;
alter table "public"."products" alter column "x" drop not null;
alter sequence "public"."bug_id_seq" owned by "public"."bug"."id";
alter sequence "public"."products_product_no_seq" owned by "public"."products"."product_no";
drop sequence if exists "public"."aunwanted_id_seq";
drop sequence if exists "public"."orders_order_id_seq";
drop type "public"."unwanted_enum";
drop extension if exists "pg_trgm";
CREATE UNIQUE INDEX order_items_pkey ON public.order_items USING btree (product_no, order_id);
CREATE INDEX products_name_idx ON public.products USING btree (name);
CREATE UNIQUE INDEX products_pkey ON public.products USING btree (product_no);
alter table "public"."order_items" add constraint "order_items_pkey" PRIMARY KEY using index "order_items_pkey";
alter table "public"."products" add constraint "products_pkey" PRIMARY KEY using index "products_pkey";
alter table "public"."order_items" add constraint "order_items_order_id_fkey" FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE not valid;
alter table "public"."order_items" validate constraint "order_items_order_id_fkey";
alter table "public"."order_items" add constraint "order_items_product_no_fkey" FOREIGN KEY (product_no) REFERENCES products(product_no) ON DELETE RESTRICT not valid;
alter table "public"."order_items" validate constraint "order_items_product_no_fkey";
alter table "public"."products" add constraint "y" CHECK ((price > (0)::numeric)) not valid;
alter table "public"."products" validate constraint "y";
alter table "public"."products" add constraint "x" CHECK ((price > (10)::numeric)) not valid;
alter table "public"."products" validate constraint "x";
set check_function_bodies = off;
CREATE OR REPLACE FUNCTION public.newfunc(i integer, t text[])
 RETURNS TABLE(a text, c integer)
 LANGUAGE plpgsql
 STABLE STRICT
AS $function$
 declare
        BEGIN
                select 'no', 1;
END;
$function$;
CREATE OR REPLACE FUNCTION public.changed(i integer, t text[])
 RETURNS TABLE(a text, c integer)
 LANGUAGE plpgsql
 STRICT SECURITY DEFINER
AS $function$
 declare
        BEGIN
                select 'no', 1;
END;
$function$;
create materialized view "public"."matvvv" as  SELECT 2 AS a;
create or replace view "public"."vvv" as  SELECT 2 AS a;
drop schema if exists "badschema";
```

</details>
