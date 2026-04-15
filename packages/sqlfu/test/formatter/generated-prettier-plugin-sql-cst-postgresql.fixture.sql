-- default config: {"dialect":"postgresql"}

-- #region: prettier-plugin-sql-cst / test / canonical_syntax.test: converts old PostgreSQL := syntax to standard => syntax for named arguments
-- input:
SELECT my_func(foo := 'Hello', bar := 'World')
-- output:
SELECT
  my_func (foo := 'Hello', bar := 'World')
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / alter_default_privileges.test: format short FOR ROLE clause on single line
-- input:
ALTER DEFAULT PRIVILEGES FOR ROLE admin GRANT SELECT ON TYPES TO abc
-- output:
ALTER DEFAULT PRIVILEGES FOR ROLE admin
GRANT
SELECT
  ON TYPES TO abc
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / alter_default_privileges.test: formats even longer REVOKE to even more lines
-- input:
ALTER DEFAULT PRIVILEGES
REVOKE GRANT OPTION FOR
  SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, MAINTAIN
  ON TABLES
FROM johnny_monny, alice_malice, sigmund_freud, elvis_presley CASCADE
-- output:
ALTER DEFAULT PRIVILEGES
REVOKE
GRANT OPTION FOR
SELECT
,
  INSERT,
UPDATE,
DELETE,
TRUNCATE,
REFERENCES,
MAINTAIN ON TABLES
FROM
  johnny_monny,
  alice_malice,
  sigmund_freud,
  elvis_presley CASCADE
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / alter_default_privileges.test: formats long clauses to multiple lines
-- input:
ALTER DEFAULT PRIVILEGES
FOR ROLE admin, moderator
IN SCHEMA magic, mushroom, shower
GRANT DELETE, TRUNCATE ON TABLES TO johnny
-- output:
ALTER DEFAULT PRIVILEGES FOR ROLE admin,
moderator IN SCHEMA magic,
mushroom,
shower
GRANT DELETE,
TRUNCATE ON TABLES TO johnny
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / alter_default_privileges.test: formats long GRANT to multiple lines
-- input:
ALTER DEFAULT PRIVILEGES
GRANT DELETE, TRUNCATE, REFERENCES, MAINTAIN ON TABLES
TO johnny WITH GRANT OPTION
-- output:
ALTER DEFAULT PRIVILEGES
GRANT DELETE,
TRUNCATE,
REFERENCES,
MAINTAIN ON TABLES TO johnny
WITH
GRANT OPTION
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / alter_default_privileges.test: formats long REVOKE to multiple lines
-- input:
ALTER DEFAULT PRIVILEGES
REVOKE GRANT OPTION FOR DELETE, TRUNCATE, REFERENCES, MAINTAIN ON TABLES
FROM johnny CASCADE
-- output:
ALTER DEFAULT PRIVILEGES
REVOKE
GRANT OPTION FOR DELETE,
TRUNCATE,
REFERENCES,
MAINTAIN ON TABLES
FROM
  johnny CASCADE
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / alter_default_privileges.test: formats short ALTER DEFAULT PRIVILEGES to multiple lines when original code is multiline
-- input:
ALTER DEFAULT PRIVILEGES
REVOKE ALL ON TABLES FROM PUBLIC
-- output:
ALTER DEFAULT PRIVILEGES
REVOKE ALL ON TABLES
FROM
  PUBLIC
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / alter_default_privileges.test: formats short GRANT on single line
-- input:
ALTER DEFAULT PRIVILEGES GRANT ALL ON TABLES TO john
-- output:
ALTER DEFAULT PRIVILEGES
GRANT ALL ON TABLES TO john
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / alter_default_privileges.test: formats short IN SCHEMA clause in single line
-- input:
ALTER DEFAULT PRIVILEGES IN SCHEMA foo GRANT SELECT ON TYPES TO abc
-- output:
ALTER DEFAULT PRIVILEGES IN SCHEMA foo
GRANT
SELECT
  ON TYPES TO abc
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / alter_default_privileges.test: formats short REVOKE on single line
-- input:
ALTER DEFAULT PRIVILEGES REVOKE ALL ON TABLES FROM john
-- output:
ALTER DEFAULT PRIVILEGES
REVOKE ALL ON TABLES
FROM
  john
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / grant.test: formats ALL PRIVILEGES
-- input:
GRANT ALL ON tbl TO john
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / grant.test: formats ALL PRIVILEGES
-- input:
GRANT ALL PRIVILEGES ON tbl TO john
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / grant.test: formats ALL PRIVILEGES on specific columns
-- input:
GRANT ALL PRIVILEGES (foo, bar, baz) ON tbl TO john
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / grant.test: formats basic statement
-- input:
GRANT moderator TO john
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / grant.test: formats extra clauses
-- input:
GRANT moderator TO john
WITH ADMIN OPTION
GRANTED BY alice
-- output:
GRANT moderator TO john
WITH
  ADMIN OPTION GRANTED BY alice
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / grant.test: formats extra long lists of roles
-- input:
GRANT
  moderator,
  administrator,
  accelerator,
  composer,
  director,
  editor,
  generator
TO
  john_doe_of_london,
  mary_jane_from_singapure,
  alice_malice_from_paris_suburbs
-- output:
GRANT moderator,
administrator,
accelerator,
composer,
director,
editor,
generator TO john_doe_of_london,
mary_jane_from_singapure,
alice_malice_from_paris_suburbs
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / grant.test: formats GRANTED BY clause
-- input:
GRANT SELECT ON tbl TO john GRANTED BY CURRENT_USER
-- output:
GRANT
SELECT
  ON tbl TO john GRANTED BY CURRENT_USER
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / grant.test: formats long GRANT to multiple lines
-- input:
GRANT SELECT
ON tbl
TO john
GRANTED BY john_doe
WITH GRANT OPTION
-- output:
GRANT
SELECT
  ON tbl TO john GRANTED BY john_doe
WITH
GRANT OPTION
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / grant.test: formats long lists of roles
-- input:
GRANT moderator, administrator, accelerator, composer
TO john_doe, mary_jane, alice_malice
-- output:
GRANT moderator,
administrator,
accelerator,
composer TO john_doe,
mary_jane,
alice_malice
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / grant.test: formats multiple roles
-- input:
GRANT moderator, administrator TO john, mary, alice
-- output:
GRANT moderator,
administrator TO john,
mary,
alice
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / grant.test: formats privilege limited to specific columns
-- input:
GRANT UPDATE (foo, bar, baz) ON tbl TO john
-- output:
GRANT
UPDATE (foo, bar, baz) ON tbl TO john
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / grant.test: formats short GRANT in single line
-- input:
GRANT SELECT ON schm.my_table TO john_doe
-- output:
GRANT
SELECT
  ON schm.my_table TO john_doe
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / grant.test: formats WITH GRANT OPTION clause
-- input:
GRANT SELECT ON tbl TO john WITH GRANT OPTION
-- output:
GRANT
SELECT
  ON tbl TO john
WITH
GRANT OPTION
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / revoke.test: formats ... OPTION FOR
-- input:
REVOKE ADMIN OPTION FOR moderator FROM john
RESTRICT
-- output:
REVOKE ADMIN OPTION FOR moderator
FROM
  john RESTRICT
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / revoke.test: formats basic statement
-- input:
REVOKE moderator FROM john
-- output:
REVOKE moderator
FROM
  john
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / revoke.test: formats extra clauses
-- input:
REVOKE moderator FROM john
GRANTED BY alice
CASCADE
-- output:
REVOKE moderator
FROM
  john GRANTED BY alice CASCADE
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / revoke.test: formats extra long lists of roles
-- input:
REVOKE
  moderator,
  administrator,
  accelerator,
  composer,
  director,
  editor,
  generator
FROM
  john_doe_of_london,
  mary_jane_from_singapure,
  alice_malice_from_paris_suburbs
-- output:
REVOKE moderator,
administrator,
accelerator,
composer,
director,
editor,
generator
FROM
  john_doe_of_london,
  mary_jane_from_singapure,
  alice_malice_from_paris_suburbs
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / revoke.test: formats GRANT OPTION FOR clause
-- input:
REVOKE GRANT OPTION FOR INSERT ON tbl FROM john
-- output:
REVOKE
GRANT OPTION FOR INSERT ON tbl
FROM
  john
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / revoke.test: formats GRANTED BY clause
-- input:
REVOKE SELECT ON tbl FROM john GRANTED BY johnny
-- output:
REVOKE
SELECT
  ON tbl
FROM
  john GRANTED BY johnny
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / revoke.test: formats long lists of roles
-- input:
REVOKE moderator, administrator, accelerator, composer
FROM john_doe, mary_jane, alice_malice
-- output:
REVOKE moderator,
administrator,
accelerator,
composer
FROM
  john_doe,
  mary_jane,
  alice_malice
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / revoke.test: formats long REVOKE to multiple lines
-- input:
REVOKE GRANT OPTION FOR SELECT
ON tbl1, tbl2
FROM john, alice, mary
GRANTED BY john_doe
RESTRICT
-- output:
REVOKE
GRANT OPTION FOR
SELECT
  ON tbl1,
  tbl2
FROM
  john,
  alice,
  mary GRANTED BY john_doe RESTRICT
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / revoke.test: formats multiple roles
-- input:
REVOKE moderator, administrator FROM john, mary, alice
-- output:
REVOKE moderator,
administrator
FROM
  john,
  mary,
  alice
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / revoke.test: formats RESTRICT/CASCADE
-- input:
REVOKE SELECT ON tbl FROM john CASCADE
-- output:
REVOKE
SELECT
  ON tbl
FROM
  john CASCADE
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / revoke.test: formats short REVOKE in single line
-- input:
REVOKE SELECT ON schm.my_table FROM john_doe
-- output:
REVOKE
SELECT
  ON schm.my_table
FROM
  john_doe
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / role.test: formats ALTER GROUP .. ADD USER
-- input:
ALTER GROUP director ADD USER john, jane, jimmy
-- output:
ALTER GROUP director
ADD USER john,
jane,
jimmy
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / role.test: formats ALTER GROUP .. DROP USER
-- input:
ALTER GROUP director DROP USER alice, bob
-- output:
ALTER GROUP director
DROP USER alice,
bob
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / role.test: formats ALTER ROLE .. IN DATABASE db {RESET | SET}
-- input:
ALTER ROLE john IN DATABASE my_db RESET ALL
-- output:
ALTER ROLE john IN DATABASE my_db
RESET ALL
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / role.test: formats ALTER ROLE .. IN DATABASE db {RESET | SET}
-- input:
ALTER ROLE john IN DATABASE my_db SET search_path TO myschema
-- output:
ALTER ROLE john IN DATABASE my_db
SET
  search_path TO myschema
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / role.test: formats ALTER ROLE .. options
-- input:
ALTER ROLE john LOGIN CREATEDB CONNECTION LIMIT 15
-- output:
ALTER ROLE john LOGIN CREATEDB CONNECTION
LIMIT
  15
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / role.test: formats ALTER ROLE .. RENAME TO
-- input:
ALTER ROLE john RENAME TO johnny
-- output:
ALTER ROLE john
RENAME TO johnny
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / role.test: formats ALTER ROLE .. RESET option
-- input:
ALTER ROLE john RESET ALL
-- output:
ALTER ROLE john
RESET ALL
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / role.test: formats ALTER ROLE .. RESET option
-- input:
ALTER ROLE john RESET search_path
-- output:
ALTER ROLE john
RESET search_path
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / role.test: formats ALTER ROLE .. SET option FROM CURRENT
-- input:
ALTER ROLE john SET search_path FROM CURRENT
-- output:
ALTER ROLE john
SET
  search_path
FROM
  CURRENT
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / role.test: formats ALTER ROLE .. SET option TO value
-- input:
ALTER ROLE john SET search_path = DEFAULT
-- output:
ALTER ROLE john
SET
  search_path = DEFAULT
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / role.test: formats ALTER ROLE .. SET option TO value
-- input:
ALTER ROLE john SET search_path TO myschema
-- output:
ALTER ROLE john
SET
  search_path TO myschema
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / role.test: formats ALTER ROLE .. WITH options
-- input:
ALTER ROLE john WITH LOGIN CREATEDB CONNECTION LIMIT 15
-- output:
ALTER ROLE john
WITH
  LOGIN CREATEDB CONNECTION
LIMIT
  15
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / role.test: formats ALTER ROLE on multiple lines if user prefers
-- input:
ALTER ROLE john
WITH LOGIN CREATEDB CONNECTION LIMIT 15
-- output:
ALTER ROLE john
WITH
  LOGIN CREATEDB CONNECTION
LIMIT
  15
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / role.test: formats basic CREATE ROLE
-- input:
CREATE ROLE john
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / role.test: formats basic DROP ROLE
-- input:
DROP ROLE john
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / role.test: formats DROP ROLE IF EXISTS
-- input:
DROP ROLE IF EXISTS john
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / role.test: formats DROP ROLE with multiple roles
-- input:
DROP ROLE role1, role2
-- output:
DROP ROLE role1,
role2
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / role.test: formats long list of options
-- input:
CREATE ROLE john WITH
  SUPERUSER
  INHERIT
  LOGIN
  CREATEDB
  CONNECTION LIMIT 15
  ENCRYPTED PASSWORD 'mypass'
  VALID UNTIL '2021-01-01'
  IN ROLE role1, role2
  ROLE role3, role4
  ADMIN role5, role6
  SYSID 123
-- output:
CREATE ROLE john
WITH
  SUPERUSER INHERIT LOGIN CREATEDB CONNECTION
LIMIT
  15 ENCRYPTED PASSWORD 'mypass' VALID UNTIL '2021-01-01' IN ROLE role1, role2 ROLE role3,
  role4 ADMIN role5,
  role6 SYSID 123
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / role.test: formats long list of options to multiple lines
-- input:
ALTER ROLE john
  LOGIN
  CREATEDB
  ADMIN role1, role2
  CONNECTION LIMIT 15
  ENCRYPTED PASSWORD 'mypass'
-- output:
ALTER ROLE john LOGIN CREATEDB ADMIN role1,
role2 CONNECTION
LIMIT
  15 ENCRYPTED PASSWORD 'mypass'
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / role.test: formats long list of WITH options to multiple lines
-- input:
ALTER ROLE john
WITH
  LOGIN
  CREATEDB
  ADMIN role1, role2
  CONNECTION LIMIT 15
  ENCRYPTED PASSWORD 'mypass'
-- output:
ALTER ROLE john
WITH
  LOGIN CREATEDB ADMIN role1,
  role2 CONNECTION
LIMIT
  15 ENCRYPTED PASSWORD 'mypass'
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / role.test: formats options (without WITH)
-- input:
CREATE ROLE john SUPERUSER INHERIT LOGIN
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / role.test: formats RESET ROLE
-- input:
RESET ROLE
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / role.test: formats SET ROLE
-- input:
SET LOCAL ROLE NONE
-- output:
SET
  LOCAL ROLE NONE
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / role.test: formats SET ROLE
-- input:
SET ROLE moderator
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / role.test: formats SET ROLE
-- input:
SET SESSION ROLE moderator
-- output:
SET
  SESSION ROLE moderator
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / role.test: formats shorter list of options to multiple lines when preferred
-- input:
CREATE ROLE john WITH
  SUPERUSER
  INHERIT
  LOGIN
-- output:
CREATE ROLE john
WITH
  SUPERUSER INHERIT LOGIN
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dcl / role.test: formats WITH options
-- input:
CREATE ROLE john WITH SUPERUSER INHERIT LOGIN
-- output:
CREATE ROLE john
WITH
  SUPERUSER INHERIT LOGIN
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / alter_table.test: formats ADD CONSTRAINT
-- input:
ALTER TABLE client
ADD CONSTRAINT price_positive CHECK (price > 0) NOT VALID
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / alter_table.test: formats ADD PRIMARY KEY
-- input:
ALTER TABLE client
ADD PRIMARY KEY (price)
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / alter_table.test: formats ADD UNIQUE
-- input:
ALTER TABLE client
ADD UNIQUE USING INDEX price_unique
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / alter_table.test: formats ALTER COLUMN .. ADD GENERATED with (sequence options)
-- input:
ALTER TABLE client
ALTER COLUMN price
ADD GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1)
-- output:
ALTER TABLE client
ALTER COLUMN price
ADD GENERATED ALWAYS AS IDENTITY (
  START
  WITH
    1 INCREMENT BY 1
)
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / alter_table.test: formats ALTER COLUMN .. ADD GENERATED with long (sequence options list)
-- input:
ALTER TABLE client
ALTER COLUMN price
ADD GENERATED ALWAYS AS IDENTITY (
  START WITH 1
  INCREMENT BY 1
  MINVALUE -1000
  MAXVALUE 1000
  NO CYCLE
)
-- output:
ALTER TABLE client
ALTER COLUMN price
ADD GENERATED ALWAYS AS IDENTITY (
  START
  WITH
    1 INCREMENT BY 1 MINVALUE -1000 MAXVALUE 1000 NO CYCLE
)
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / alter_table.test: formats ALTER COLUMN .. SET DATA TYPE
-- input:
ALTER TABLE client
ALTER COLUMN price
TYPE INT COLLATE "en_US" USING price > 0
-- output:
ALTER TABLE client
ALTER COLUMN price TYPE INT COLLATE "en_US" USING price > 0
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / alter_table.test: formats ALTER CONSTRAINT
-- input:
ALTER TABLE client
ALTER CONSTRAINT price_positive DEFERRABLE INITIALLY DEFERRED
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / alter_table.test: formats ALTER TABLE ALL IN TABLESPACE
-- input:
ALTER TABLE ALL IN TABLESPACE my_tablespace
SET TABLESPACE new_tablespace
-- output:
ALTER TABLE ALL IN TABLESPACE my_tablespace
SET
  TABLESPACE new_tablespace
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / alter_table.test: formats ALTER TABLE ALL IN TABLESPACE..OWNED BY
-- input:
ALTER TABLE ALL IN TABLESPACE my_tablespace OWNED BY
  john_doe_the_second,
  CURRENT_USER
SET TABLESPACE new_tablespace NOWAIT
-- output:
ALTER TABLE ALL IN TABLESPACE my_tablespace OWNED BY john_doe_the_second,
CURRENT_USER
SET
  TABLESPACE new_tablespace NOWAIT
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / alter_table.test: formats ALTER TABLE ALL IN TABLESPACE..OWNED BY
-- input:
ALTER TABLE ALL IN TABLESPACE my_ts OWNED BY user1, user2
SET TABLESPACE new_ts
-- output:
ALTER TABLE ALL IN TABLESPACE my_ts OWNED BY user1,
user2
SET
  TABLESPACE new_ts
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / alter_table.test: formats ALTER TABLE with [NO] FORCE actions
-- input:
ALTER TABLE client
FORCE ROW LEVEL SECURITY,
NO FORCE ROW LEVEL SECURITY
-- output:
ALTER TABLE client FORCE ROW LEVEL SECURITY,
NO FORCE ROW LEVEL SECURITY
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / alter_table.test: formats ALTER TABLE with clustering actions
-- input:
ALTER TABLE client
CLUSTER ON index_name,
SET WITHOUT CLUSTER
-- output:
ALTER TABLE client
CLUSTER ON index_name,
SET
  WITHOUT
CLUSTER
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / alter_table.test: formats ALTER TABLE with ENABLE/DISABLE actions
-- input:
ALTER TABLE client
DISABLE TRIGGER ALL,
ENABLE TRIGGER my_trigger,
ENABLE REPLICA TRIGGER trigger2,
ENABLE ALWAYS TRIGGER trigger3,
ENABLE REPLICA RULE my_rule,
DISABLE RULE r2,
DISABLE ROW LEVEL SECURITY,
ENABLE ROW LEVEL SECURITY
-- output:
ALTER TABLE client DISABLE TRIGGER ALL,
ENABLE TRIGGER my_trigger,
ENABLE REPLICA TRIGGER trigger2,
ENABLE ALWAYS TRIGGER trigger3,
ENABLE REPLICA RULE my_rule,
DISABLE RULE r2,
DISABLE ROW LEVEL SECURITY,
ENABLE ROW LEVEL SECURITY
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / alter_table.test: formats ALTER TABLE with inheritance actions
-- input:
ALTER TABLE client
INHERIT parent_table,
NO INHERIT grandparent_table
-- output:
ALTER TABLE client INHERIT parent_table,
NO INHERIT grandparent_table
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / alter_table.test: formats ALTER TABLE with logging actions
-- input:
ALTER TABLE client
SET LOGGED,
SET UNLOGGED
-- output:
ALTER TABLE client
SET
  LOGGED,
SET
  UNLOGGED
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / alter_table.test: formats ALTER TABLE with OF type actions
-- input:
ALTER TABLE client
OF new_type,
NOT OF
-- output:
ALTER TABLE client OF new_type,
NOT OF
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / alter_table.test: formats ALTER TABLE with PostgreSQL alter-actions
-- input:
ALTER TABLE client
SET SCHEMA new_schema,
SET TABLESPACE new_tablespace NOWAIT,
SET WITHOUT OIDS,
SET ACCESS METHOD heap,
OWNER TO new_owner,
OWNER TO CURRENT_USER,
REPLICA IDENTITY DEFAULT,
REPLICA IDENTITY USING INDEX index_name
-- output:
ALTER TABLE client
SET SCHEMA new_schema,
SET
  TABLESPACE new_tablespace NOWAIT,
SET
  WITHOUT OIDS,
SET
  ACCESS METHOD heap,
  OWNER TO new_owner,
  OWNER TO CURRENT_USER,
  REPLICA IDENTITY DEFAULT,
  REPLICA IDENTITY USING INDEX index_name
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / alter_table.test: formats ALTER TABLE with SET/RESET (long storage parameters list)
-- input:
ALTER TABLE client
SET (
  fillfactor = 70,
  autovacuum_enabled,
  toast.autovacuum_enabled,
  max_rows = 100,
  visibility_map
),
RESET (
  toast.autovacuum_enabled,
  max_rows,
  autovacuum_enabled,
  fillfactor,
  parallel_workers
)
-- output:
ALTER TABLE client
SET
  (
    fillfactor = 70,
    autovacuum_enabled,
    toast.autovacuum_enabled,
    max_rows = 100,
    visibility_map
  ),
RESET (
  toast.autovacuum_enabled,
  max_rows,
  autovacuum_enabled,
  fillfactor,
  parallel_workers
)
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / alter_table.test: formats ALTER TABLE with SET/RESET (storage parameters)
-- input:
ALTER TABLE client
SET (fillfactor = 70, autovacuum_enabled),
RESET (toast.autovacuum_enabled, max_rows)
-- output:
ALTER TABLE client
SET
  (fillfactor = 70, autovacuum_enabled),
RESET (toast.autovacuum_enabled, max_rows)
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / alter_table.test: formats ALTER TABLE..ADD COLUMN with constraints
-- input:
ALTER TABLE client
ADD COLUMN col1 INT COLLATE "en_US" NOT NULL
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / alter_table.test: formats DROP CONSTRAINT
-- input:
ALTER TABLE client
DROP CONSTRAINT IF EXISTS price_positive CASCADE
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / alter_table.test: formats DROP CONSTRAINT
-- input:
ALTER TABLE client
DROP CONSTRAINT price_positive
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / alter_table.test: formats identity altering actions
-- input:
ALTER TABLE client
ALTER COLUMN price
SET GENERATED ALWAYS RESTART WITH 100 SET MAXVALUE 1000
-- output:
ALTER TABLE client
ALTER COLUMN price
SET
  GENERATED ALWAYS RESTART
WITH
  100
SET
  MAXVALUE 1000
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / alter_table.test: formats long ADD CONSTRAINT
-- input:
ALTER TABLE client
ADD CONSTRAINT price_is_valid
  CHECK (client.price > 0 OR client.type = 'special')
-- output:
ALTER TABLE client
ADD CONSTRAINT price_is_valid CHECK (
  client.price > 0
  OR client.type = 'special'
)
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / alter_table.test: formats lots of identity altering actions
-- input:
ALTER TABLE client
ALTER COLUMN price
SET GENERATED ALWAYS
RESTART WITH 100
SET MAXVALUE 1000
SET MINVALUE 0
SET NO CYCLE
-- output:
ALTER TABLE client
ALTER COLUMN price
SET
  GENERATED ALWAYS RESTART
WITH
  100
SET
  MAXVALUE 1000
SET
  MINVALUE 0
SET
  NO CYCLE
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / alter_table.test: formats RENAME CONSTRAINT
-- input:
ALTER TABLE client
RENAME CONSTRAINT price_positive1 TO price_positive2
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / alter_table.test: formats VALIDATE CONSTRAINT
-- input:
ALTER TABLE client
VALIDATE CONSTRAINT price_positive
-- output:
ALTER TABLE client VALIDATE CONSTRAINT price_positive
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / create_table.test: formats additional PostgeSQL CREATE TABLE clauses
-- input:
CREATE TABLE client (
  id INT
)
INHERITS (parent_table1, parent_table2)
PARTITION BY LIST (id, name my_opclass)
USING "SP-GiST"
TABLESPACE pg_default
WITH (fillfactor = 70, autovacuum_enabled)
WITHOUT OIDS
ON COMMIT DELETE ROWS
-- output:
CREATE TABLE client (id INT) INHERITS (parent_table1, parent_table2)
PARTITION BY
  LIST (id, name my_opclass) USING "SP-GiST" TABLESPACE pg_default
WITH
  (fillfactor = 70, autovacuum_enabled) WITHOUT OIDS ON
COMMIT DELETE ROWS
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / create_table.test: formats constraints with index-parameter clauses
-- input:
CREATE TABLE client (
  id INT,
  PRIMARY KEY (id) INCLUDE (name),
  UNIQUE (id) USING INDEX TABLESPACE pg_default,
  EXCLUDE
    (id WITH =)
    WITH (fillfactor = 70, autovacuum_enabled)
    USING INDEX TABLESPACE pg_default
    WHERE (id > 0)
)
-- output:
CREATE TABLE client (
  id INT,
  PRIMARY KEY (id) INCLUDE (name),
  UNIQUE (id) USING INDEX TABLESPACE pg_default,
  EXCLUDE (
    id
    WITH
      =
  )
  WITH
    (fillfactor = 70, autovacuum_enabled) USING INDEX TABLESPACE pg_default
  WHERE
    (id > 0)
)
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / create_table.test: formats CREATE GLOBAL TEMPORARY TABLE
-- input:
CREATE GLOBAL TEMPORARY TABLE foo (
  id INT
)
-- output:
CREATE GLOBAL TEMPORARY TABLE foo (id INT)
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / create_table.test: formats CREATE TABLE AS with additional clauses
-- input:
CREATE TABLE foo
AS
  SELECT * FROM tbl WHERE x > 0
WITH NO DATA
-- output:
CREATE TABLE foo AS
SELECT
  *
FROM
  tbl
WHERE
  x > 0
WITH
  NO DATA
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / create_table.test: formats CREATE TABLE LIKE inside parenthesis
-- input:
CREATE TABLE foo (
  LIKE my_old_table INCLUDING COMMENTS EXCLUDING CONSTRAINTS
)
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / create_table.test: formats EXCLUDE constraint
-- input:
CREATE TABLE client (
  id INT,
  EXCLUDE (id WITH =, name WITH <>) WHERE (id > 0)
)
-- output:
CREATE TABLE client (
  id INT,
  EXCLUDE (
    id
    WITH
      =,
      name
    WITH
      <>
  )
  WHERE
    (id > 0)
)
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / create_table.test: formats FOREIGN KEY constraint with actions that specify columns
-- input:
CREATE TABLE client (
  id INT,
  FOREIGN KEY (org_id1) REFERENCES organization (id1)
    ON DELETE SET NULL (id1, id2)
    ON UPDATE SET DEFAULT (id1, id2)
)
-- output:
CREATE TABLE client (
  id INT,
  FOREIGN KEY (org_id1) REFERENCES organization (id1) ON DELETE SET NULL (id1, id2) ON UPDATE SET DEFAULT (id1, id2)
)
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / create_table.test: formats INTERVAL data types
-- input:
CREATE TABLE client (
  foo INTERVAL DAY TO SECOND (2)
)
-- output:
CREATE TABLE client (foo INTERVAL DAY TO SECOND (2))
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / create_table.test: formats long EXCLUDE constraint
-- input:
CREATE TABLE client (
  id INT,
  EXCLUDE
    USING gist
    (id WITH =, name opClass DESC NULLS FIRST WITH <>)
    WHERE (id > 0)
)
-- output:
CREATE TABLE client (
  id INT,
  EXCLUDE USING gist (
    id
    WITH
      =,
      name opClass DESC NULLS FIRST
    WITH
      <>
  )
  WHERE
    (id > 0)
)
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / create_table.test: formats PostgreSQL array data types
-- input:
CREATE TABLE client (
  arr_field INT[],
  arr_field2 INT[10][10],
  arr_field3 INT[][]
)
-- output:
CREATE TABLE client (
  arr_field INT[],
  arr_field2 INT[10] [10],
  arr_field3 INT[] []
)
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / create_table.test: formats PostgreSQL column constraints
-- input:
CREATE TABLE client (
  id INT GENERATED BY DEFAULT AS IDENTITY,
  fname VARCHAR(100) COMPRESSION PGLZ STORAGE EXTERNAL,
  lname VARCHAR(100) UNIQUE NULLS NOT DISTINCT,
  created_at DATE DEFAULT now()
)
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / create_table.test: formats PostgreSQL CREATE FOREIGN TABLE
-- input:
CREATE FOREIGN TABLE film (
  title TEXT,
  ryear INT OPTIONS (column_name 'release_year')
)
SERVER film_server
OPTIONS (format 'csv', delimiter ',', header 'true')
-- output:
CREATE FOREIGN TABLE film (
  title TEXT,
  ryear INT OPTIONS (column_name 'release_year')
) SERVER film_server OPTIONS (format 'csv', delimiter ',', header 'true')
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / create_table.test: formats PostgreSQL CREATE TABLE ... OF type & WITH OPTIONS
-- input:
CREATE TABLE client OF client_type (
  id WITH OPTIONS NOT NULL PRIMARY KEY
)
-- output:
CREATE TABLE client OF client_type (
  id
  WITH
    OPTIONS NOT NULL PRIMARY KEY
)
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / create_table.test: formats PostgreSQL CREATE TABLE ... PARTITION OF
-- input:
CREATE TABLE client_new PARTITION OF client
FOR VALUES FROM (2023, MINVALUE) TO (2024, MAXVALUE)
-- output:
CREATE TABLE client_new PARTITION OF client FOR
VALUES
FROM
  (2023, MINVALUE) TO (2024, MAXVALUE)
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / create_table.test: formats PostgreSQL CREATE TABLE ... PARTITION OF
-- input:
CREATE TABLE client_odd PARTITION OF client
FOR VALUES WITH (MODULUS 3, REMAINDER 1)
-- output:
CREATE TABLE client_odd PARTITION OF client FOR
VALUES
WITH
  (MODULUS 3, REMAINDER 1)
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / create_table.test: formats PostgreSQL CREATE TABLE ... PARTITION OF
-- input:
CREATE TABLE client_odd PARTITION OF client DEFAULT
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / create_table.test: formats PostgreSQL CREATE TABLE ... PARTITION OF
-- input:
CREATE TABLE client_old PARTITION OF client FOR VALUES IN (1999, 2000, 2001)
-- output:
CREATE TABLE client_old PARTITION OF client FOR
VALUES
  IN (1999, 2000, 2001)
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / create_table.test: formats PostgreSQL GENERATED AS IDENTITY with sequence options
-- input:
CREATE TABLE client (
  id INT GENERATED ALWAYS AS IDENTITY (
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 1000
    CYCLE
  )
)
-- output:
CREATE TABLE client (
  id INT GENERATED ALWAYS AS IDENTITY (
    START
    WITH
      1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 1000 CYCLE
  )
)
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / create_table.test: formats PostgreSQL GENERATED AS IDENTITY with sequence options
-- input:
CREATE TABLE client (
  id INT GENERATED ALWAYS AS IDENTITY (START WITH 1)
)
-- output:
CREATE TABLE client (
  id INT GENERATED ALWAYS AS IDENTITY (
    START
    WITH
      1
  )
)
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / create_table.test: formats PostgreSQL SETOF data types
-- input:
CREATE TABLE client (
  foo SETOF INT,
  bar SETOF CHARACTER VARYING,
  baz SETOF MY_CUSTOM_TYPE
)
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / create_table.test: formats TIME/TIMESTAMP data types
-- input:
CREATE TABLE client (
  from_date TIME WITH TIME ZONE,
  to_date TIMESTAMP(5) WITHOUT TIME ZONE
)
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / domain.test: formats ALTER DOMAIN
-- input:
ALTER DOMAIN my_domain SET DEFAULT 0
-- output:
ALTER DOMAIN my_domain
SET DEFAULT 0
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / domain.test: formats CREATE DOMAIN
-- input:
CREATE DOMAIN my_domain INT
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / domain.test: formats CREATE DOMAIN with AS
-- input:
CREATE DOMAIN my_domain AS VARCHAR(255)
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / domain.test: formats CREATE DOMAIN with constraints
-- input:
CREATE DOMAIN my_domain VARCHAR(255) NOT NULL CHECK (value > 0)
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / domain.test: formats CREATE DOMAIN with constraints to multiple lines if user prefers
-- input:
CREATE DOMAIN my_domain VARCHAR(255)
  NOT NULL
  CHECK (value > 0)
-- output:
CREATE DOMAIN my_domain VARCHAR(255) NOT NULL CHECK (value > 0)
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / domain.test: formats CREATE DOMAIN with named constraints
-- input:
CREATE DOMAIN my_domain VARCHAR(255)
  CONSTRAINT my_const1 NULL
  CONSTRAINT my_const2 CHECK (value > 0)
-- output:
CREATE DOMAIN my_domain VARCHAR(255) CONSTRAINT my_const1 NULL CONSTRAINT my_const2 CHECK (value > 0)
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / domain.test: formats DROP DOMAIN
-- input:
DROP DOMAIN my_domain
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / domain.test: formats DROP DOMAIN .. IF EXISTS ... CASCADE
-- input:
DROP DOMAIN IF EXISTS my_domain CASCADE
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / domain.test: formats DROP DOMAIN with multiple domain names
-- input:
DROP DOMAIN my_domain1, my_domain2, my_domain3
-- output:
DROP DOMAIN my_domain1,
my_domain2,
my_domain3
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / drop_table.test: formats CASCADE|RESTRICT
-- input:
DROP TABLE foo CASCADE
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / drop_table.test: formats multiple table names
-- input:
DROP TABLE foo, bar, baz
-- output:
DROP TABLE foo,
bar,
baz
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / function.test: converts single-quoted SQL function to dollar-quoted SQL function
-- input:
CREATE FUNCTION my_func()
RETURNS TEXT
LANGUAGE sql
AS 'SELECT ''foo'''
-- output:
CREATE FUNCTION my_func () RETURNS TEXT LANGUAGE sql AS 'SELECT ''foo'''
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / function.test: does not reformat E'quoted' strings
-- input:
CREATE FUNCTION my_func()
RETURNS INT
LANGUAGE sql
AS E'SELECT 1'
-- output:
CREATE FUNCTION my_func () RETURNS INT LANGUAGE sql AS E'SELECT 1'
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / function.test: does not reformat single-quoted SQL function when its source contains $$-quotes
-- input:
CREATE FUNCTION my_func()
RETURNS TEXT
LANGUAGE sql
AS 'SELECT $$foo$$'
-- output:
CREATE FUNCTION my_func () RETURNS TEXT LANGUAGE sql AS 'SELECT $$foo$$'
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / function.test: formats dollar-quoted SQL function
-- input:
CREATE FUNCTION my_func()
RETURNS INT64
LANGUAGE sql
AS $$
  SELECT 1;
$$
-- output:
CREATE FUNCTION my_func () RETURNS INT64 LANGUAGE sql AS $$
  SELECT 1;
$$
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / function.test: formats long parameter list and CASCADE|RESTRICT
-- input:
DROP FUNCTION is_user_allowed_to_enter(
  user_id INT,
  event_id INT,
  OUT event_date DATE
) CASCADE
-- output:
DROP FUNCTION is_user_allowed_to_enter (user_id INT, event_id INT, OUT event_date DATE) CASCADE
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / function.test: formats long parameter list to multiple lines
-- input:
CREATE FUNCTION my_func(
  IN first_name TEXT,
  OUT last_name TEXT,
  year_of_birth INT DEFAULT 2000,
  INOUT age INT = 0,
  VARIADIC other_names TEXT[]
) AS 'SELECT 1'
-- output:
CREATE FUNCTION my_func (
  IN first_name TEXT,
  OUT last_name TEXT,
  year_of_birth INT DEFAULT 2000,
  INOUT age INT = 0,
  VARIADIC other_names TEXT[]
) AS 'SELECT 1'
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / function.test: formats multiple function names
-- input:
DROP FUNCTION func1(user_id INT), func2(user_id INT) CASCADE
-- output:
DROP FUNCTION func1 (user_id INT),
func2 (user_id INT) CASCADE
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / function.test: formats parameter list
-- input:
DROP FUNCTION my_func(foo INT, bar TEXT)
-- output:
DROP FUNCTION my_func (foo INT, bar TEXT)
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / function.test: formats PostgreSQL-specific clauses
-- input:
CREATE FUNCTION my_func()
RETURNS INT
LANGUAGE SQL
IMMUTABLE
NOT LEAKPROOF
CALLED ON NULL INPUT
EXTERNAL SECURITY DEFINER
PARALLEL UNSAFE
COST 100
ROWS 1000
SUPPORT schm.foo
TRANSFORM FOR TYPE INT, FOR TYPE VARCHAR(100)
RETURN 5 + 5
-- output:
CREATE FUNCTION my_func () RETURNS INT LANGUAGE SQL IMMUTABLE NOT LEAKPROOF CALLED ON NULL INPUT EXTERNAL SECURITY DEFINER PARALLEL UNSAFE COST 100 ROWS 1000 SUPPORT schm.foo TRANSFORM FOR TYPE INT,
FOR TYPE VARCHAR(100) RETURN 5 + 5
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / function.test: formats RETURNS TABLE
-- input:
CREATE FUNCTION foo()
RETURNS TABLE (id INT, name TEXT)
AS 'SELECT 1'
-- output:
CREATE FUNCTION foo () RETURNS TABLE (id INT, name TEXT) AS 'SELECT 1'
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / function.test: formats SET config variables
-- input:
CREATE FUNCTION my_func()
SET search_path TO my_schema, my_other_schema
SET check_function_bodies = DEFAULT
SET client_min_messages FROM CURRENT
BEGIN ATOMIC
  RETURN 1;
END
-- output:
CREATE FUNCTION my_func ()
SET
  search_path TO my_schema,
  my_other_schema
SET
  check_function_bodies = DEFAULT
SET
  client_min_messages
FROM
  CURRENT
BEGIN ATOMIC RETURN 1;

END
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / function.test: formats WINDOW function loaded from object file
-- input:
CREATE FUNCTION my_func()
RETURNS INT
AS 'my_lib.so', 'my_func'
LANGUAGE C
WINDOW
STRICT
-- output:
CREATE FUNCTION my_func () RETURNS INT AS 'my_lib.so',
'my_func' LANGUAGE C
WINDOW
  STRICT
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / function.test: handles SQL language identifier case-insensitively
-- input:
CREATE FUNCTION my_func()
RETURNS INT64
LANGUAGE Sql
AS 'SELECT 1'
-- output:
CREATE FUNCTION my_func () RETURNS INT64 LANGUAGE Sql AS 'SELECT 1'
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / function.test: reformats SQL in dollar-quoted SQL function
-- input:
CREATE FUNCTION my_func()
RETURNS INT64
LANGUAGE sql
AS $body$SELECT 1;
select 2$body$
-- output:
CREATE FUNCTION my_func () RETURNS INT64 LANGUAGE sql AS $body$SELECT 1;
select 2$body$
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / index.test: formats [NO] DEPENDS ON EXTENSION
-- input:
ALTER INDEX my_index DEPENDS ON EXTENSION my_extension
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / index.test: formats [NO] DEPENDS ON EXTENSION
-- input:
ALTER INDEX my_index NO DEPENDS ON EXTENSION my_extension
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / index.test: formats ALTER COLUMN SET STATISTICS
-- input:
ALTER INDEX my_index ALTER COLUMN col SET STATISTICS 100
-- output:
ALTER INDEX my_index
ALTER COLUMN col
SET
  STATISTICS 100
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / index.test: formats ALTER INDEX ALL IN TABLESPACE
-- input:
ALTER INDEX ALL IN TABLESPACE my_tablespace OWNED BY my_user, CURRENT_USER
SET TABLESPACE another_tablespace NOWAIT
-- output:
ALTER INDEX ALL IN TABLESPACE my_tablespace OWNED BY my_user,
CURRENT_USER
SET
  TABLESPACE another_tablespace NOWAIT
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / index.test: formats ATTACH PARTITION
-- input:
ALTER INDEX my_index ATTACH PARTITION my_partition
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / index.test: formats CASCADE|RESTRICT
-- input:
DROP INDEX my_index CASCADE
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / index.test: formats column list with various index parameters
-- input:
CREATE INDEX my_index ON my_table (
  column_name_one COLLATE "C" ASC NULLS FIRST,
  column_name_two DESC NULLS LAST,
  (col3 + col4) my_opclass (foo = 'bar', baz = 'qux') ASC
)
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / index.test: formats CONCURRENTLY
-- input:
CREATE INDEX CONCURRENTLY IF NOT EXISTS my_index ON my_table (col)
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / index.test: formats CONCURRENTLY
-- input:
CREATE INDEX CONCURRENTLY my_index ON my_table (col)
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / index.test: formats CONCURRENTLY
-- input:
DROP INDEX CONCURRENTLY IF EXISTS my_index
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / index.test: formats CONCURRENTLY
-- input:
DROP INDEX CONCURRENTLY my_index
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / index.test: formats CONCURRENTLY
-- input:
REINDEX DATABASE CONCURRENTLY
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / index.test: formats CONCURRENTLY
-- input:
REINDEX TABLE CONCURRENTLY my_schema.my_table
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / index.test: formats CREATE INDEX with PostgreSQL clauses
-- input:
CREATE INDEX my_index ON my_table (col1)
INCLUDE (col2, col3)
NULLS NOT DISTINCT
NULLS DISTINCT
WITH (fillfactor = 70)
TABLESPACE my_tablespace
WHERE col4 > 10
-- output:
CREATE INDEX my_index ON my_table (col1) INCLUDE (col2, col3) NULLS NOT DISTINCT NULLS DISTINCT
WITH
  (fillfactor = 70) TABLESPACE my_tablespace
WHERE
  col4 > 10
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / index.test: formats IF EXISTS
-- input:
ALTER INDEX IF EXISTS my_index RENAME TO new_index
-- output:
ALTER INDEX IF EXISTS my_index
RENAME TO new_index
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / index.test: formats multiple indexes
-- input:
DROP INDEX my_index1, my_index2
-- output:
DROP INDEX my_index1,
my_index2
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / index.test: formats options
-- input:
REINDEX (
  CONCURRENTLY TRUE,
  TABLESPACE another_tablespace,
  VERBOSE FALSE
) TABLE my_table
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / index.test: formats options
-- input:
REINDEX (CONCURRENTLY TRUE, TABLESPACE my_tbs) TABLE my_table
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / index.test: formats REINDEX type
-- input:
REINDEX INDEX my_index
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / index.test: formats REINDEX type
-- input:
REINDEX SYSTEM
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / index.test: formats REINDEX type
-- input:
REINDEX TABLE my_schema.my_table
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / index.test: formats RENAME TO
-- input:
ALTER INDEX my_index RENAME TO new_index
-- output:
ALTER INDEX my_index
RENAME TO new_index
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / index.test: formats RESET
-- input:
ALTER INDEX my_index RESET (fillfactor)
-- output:
ALTER INDEX my_index
RESET (fillfactor)
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / index.test: formats SET
-- input:
ALTER INDEX my_index SET (fillfactor = 70)
-- output:
ALTER INDEX my_index
SET
  (fillfactor = 70)
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / index.test: formats SET TABLESPACE
-- input:
ALTER INDEX my_index SET TABLESPACE my_tablespace
-- output:
ALTER INDEX my_index
SET
  TABLESPACE my_tablespace
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / index.test: formats to multiple lines if user prefers
-- input:
ALTER INDEX my_index
RENAME TO new_index
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / index.test: formats USING clause
-- input:
CREATE INDEX my_index ON my_table USING "btree" (col)
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / policy.test: formats ALTER POLICY .. altering of various clauses
-- input:
ALTER POLICY be_kind ON users
TO johnny, sally
USING (kind = 'public')
WITH CHECK (kind = 'public')
-- output:
ALTER POLICY be_kind ON users TO johnny,
sally USING (kind = 'public')
WITH
  CHECK (kind = 'public')
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / policy.test: formats ALTER POLICY .. RENAME
-- input:
ALTER POLICY be_kind ON users RENAME TO be_evil
-- output:
ALTER POLICY be_kind ON users
RENAME TO be_evil
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / policy.test: formats basic DROP POLICY
-- input:
DROP POLICY be_kind ON admin
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / policy.test: formats CREATE POLICY with all possible clauses
-- input:
CREATE POLICY be_kind_policy ON permissions
AS RESTRICTIVE
FOR SELECT
TO johnny, sally
USING (kind = 'public')
WITH CHECK (kind = 'public')
-- output:
CREATE POLICY be_kind_policy ON permissions AS RESTRICTIVE FOR
SELECT
  TO johnny,
  sally USING (kind = 'public')
WITH
  CHECK (kind = 'public')
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / policy.test: formats IF EXISTS and CASCADE/RESTRICT
-- input:
DROP POLICY IF EXISTS be_kind ON admin CASCADE
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / policy.test: formats minimal CREATE POLICY
-- input:
CREATE POLICY be_kind_policy ON permissions
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / policy.test: formats multi-line short CREATE POLICY (if user prefers)
-- input:
CREATE POLICY be_kind_policy ON permissions
AS PERMISSIVE
FOR SELECT
-- output:
CREATE POLICY be_kind_policy ON permissions AS PERMISSIVE FOR
SELECT
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / policy.test: formats single-line short CREATE POLICY
-- input:
CREATE POLICY be_kind_policy ON permissions AS PERMISSIVE FOR SELECT
-- output:
CREATE POLICY be_kind_policy ON permissions AS PERMISSIVE FOR
SELECT
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / procedure.test: converts single-quoted SQL procedures to dollar-quoted SQL procedures
-- input:
CREATE PROCEDURE my_proc()
LANGUAGE sql
AS 'SELECT ''foo'''
-- output:
CREATE PROCEDURE my_proc () LANGUAGE sql AS 'SELECT ''foo'''
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / procedure.test: does not reformat E'quoted' strings
-- input:
CREATE PROCEDURE foo()
LANGUAGE sql
AS E'SELECT 1'
-- output:
CREATE PROCEDURE foo () LANGUAGE sql AS E'SELECT 1'
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / procedure.test: does not reformat single-quoted SQL procedure when its source contains $$-quotes
-- input:
CREATE PROCEDURE my_proc()
LANGUAGE sql
AS 'SELECT $$foo$$'
-- output:
CREATE PROCEDURE my_proc () LANGUAGE sql AS 'SELECT $$foo$$'
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / procedure.test: formats default parameter values
-- input:
CREATE PROCEDURE eliminate_tbl(id INT = 1, TEXT DEFAULT 'foo')
BEGIN ATOMIC
  DROP TABLE my_table;
END
-- output:
CREATE PROCEDURE eliminate_tbl (id INT = 1, TEXT DEFAULT 'foo')
BEGIN ATOMIC
DROP TABLE my_table;

END
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / procedure.test: formats dollar-quoted SQL procedure
-- input:
CREATE PROCEDURE my_proc()
LANGUAGE sql
AS $$
  SELECT 1;
$$
-- output:
CREATE PROCEDURE my_proc () LANGUAGE sql AS $$
  SELECT 1;
$$
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / procedure.test: formats long parameter list and CASCADE|RESTRICT
-- input:
DROP PROCEDURE is_user_allowed_to_enter(
  user_id INT,
  event_id INT,
  OUT event_date DATE
) RESTRICT
-- output:
DROP PROCEDURE is_user_allowed_to_enter (user_id INT, event_id INT, OUT event_date DATE) RESTRICT
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / procedure.test: formats multiple procedure names
-- input:
DROP PROCEDURE proc1(user_id INT), proc2(user_id INT) CASCADE
-- output:
DROP PROCEDURE proc1 (user_id INT),
proc2 (user_id INT) CASCADE
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / procedure.test: formats parameter list
-- input:
DROP PROCEDURE my_func(foo INT, bar TEXT)
-- output:
DROP PROCEDURE my_func (foo INT, bar TEXT)
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / procedure.test: handles SQL language identifier case-insensitively
-- input:
CREATE PROCEDURE my_proc()
LANGUAGE Sql
AS 'SELECT 1'
-- output:
CREATE PROCEDURE my_proc () LANGUAGE Sql AS 'SELECT 1'
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / procedure.test: reformats SQL in dollar-quoted SQL procedure
-- input:
CREATE PROCEDURE my_proc()
LANGUAGE sql
AS $body$SELECT 1;
select 2$body$
-- output:
CREATE PROCEDURE my_proc () LANGUAGE sql AS $body$SELECT 1;
select 2$body$
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / schema.test: formats ALTER SCHEMA .. OWNER TO
-- input:
ALTER SCHEMA my_schema OWNER TO CURRENT_USER
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / schema.test: formats ALTER SCHEMA .. RENAME TO
-- input:
ALTER SCHEMA my_schema RENAME TO new_schema
-- output:
ALTER SCHEMA my_schema
RENAME TO new_schema
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / schema.test: formats AUTHORIZATION
-- input:
CREATE SCHEMA schema_name
AUTHORIZATION CURRENT_USER
-- output:
CREATE SCHEMA schema_name AUTHORIZATION CURRENT_USER
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / schema.test: formats CREATE SCHEMA without schema name
-- input:
CREATE SCHEMA AUTHORIZATION my_user
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / schema.test: formats nested statements
-- input:
CREATE SCHEMA inventory
AUTHORIZATION my_user
  CREATE TABLE product (
    name TEXT,
    price DECIMAL(5, 2)
  )
  CREATE VIEW all_products AS
    SELECT * FROM product
-- output:
CREATE SCHEMA inventory AUTHORIZATION my_user
CREATE TABLE product (name TEXT, price DECIMAL(5, 2))
CREATE VIEW all_products AS
SELECT
  *
FROM
  product
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / sequence.test: formats all possible sequence options
-- input:
ALTER SEQUENCE IF EXISTS my_seq
  SEQUENCE NAME my_sequence
  UNLOGGED
  RESTART WITH 100
  INCREMENT BY 2
  MINVALUE 0
  MAXVALUE 1000
  NO MINVALUE
  NO MAXVALUE
  START WITH 10
  RESTART WITH 100
  CACHE 10
  CYCLE
  NO CYCLE
  OWNED BY my_table.my_column
  OWNED BY NONE
-- output:
ALTER SEQUENCE IF EXISTS my_seq SEQUENCE NAME my_sequence UNLOGGED RESTART
WITH
  100 INCREMENT BY 2 MINVALUE 0 MAXVALUE 1000 NO MINVALUE NO MAXVALUE START
WITH
  10 RESTART
WITH
  100 CACHE 10 CYCLE NO CYCLE OWNED BY my_table.my_column OWNED BY NONE
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / sequence.test: formats all possible sequence options
-- input:
CREATE SEQUENCE my_seq
  SEQUENCE NAME my_sequence
  LOGGED
  AS INTEGER
  INCREMENT BY -2
  MINVALUE -1000
  MAXVALUE 1000
  NO MINVALUE
  NO MAXVALUE
  START WITH 10
  RESTART WITH 100
  CACHE 10
  NO CYCLE
  CYCLE
  OWNED BY my_table.my_column
  OWNED BY NONE
-- output:
CREATE SEQUENCE my_seq SEQUENCE NAME my_sequence LOGGED AS INTEGER INCREMENT BY -2 MINVALUE -1000 MAXVALUE 1000 NO MINVALUE NO MAXVALUE START
WITH
  10 RESTART
WITH
  100 CACHE 10 NO CYCLE CYCLE OWNED BY my_table.my_column OWNED BY NONE
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / sequence.test: formats ALTER SEQUENCE
-- input:
ALTER SEQUENCE my_seq
  RESTART WITH 100
-- output:
ALTER SEQUENCE my_seq RESTART
WITH
  100
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / sequence.test: formats CASCADE/RESTRICT
-- input:
DROP SEQUENCE my_seq CASCADE
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / sequence.test: formats CREATE SEQUENCE on a single line
-- input:
CREATE SEQUENCE my_seq START WITH 10 NO CYCLE MAXVALUE 1000
-- output:
CREATE SEQUENCE my_seq START
WITH
  10 NO CYCLE MAXVALUE 1000
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / sequence.test: formats CREATE SEQUENCE on multiple lines when user prefers
-- input:
CREATE SEQUENCE my_seq
  START WITH 10
  NO CYCLE
  MAXVALUE 1000
-- output:
CREATE SEQUENCE my_seq START
WITH
  10 NO CYCLE MAXVALUE 1000
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / sequence.test: formats DROP SEQUENCE
-- input:
DROP SEQUENCE seq1, seq2
-- output:
DROP SEQUENCE seq1,
seq2
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / sequence.test: formats IF EXISTS
-- input:
ALTER SEQUENCE IF EXISTS my_seq
  RESTART WITH 100
-- output:
ALTER SEQUENCE IF EXISTS my_seq RESTART
WITH
  100
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / sequence.test: formats IF EXISTS
-- input:
DROP SEQUENCE IF EXISTS my_seq
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / sequence.test: formats IF NOT EXISTS
-- input:
CREATE SEQUENCE IF NOT EXISTS my_seq START WITH 1
-- output:
CREATE SEQUENCE IF NOT EXISTS my_seq START
WITH
  1
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / sequence.test: formats minimal CREATE SEQUENCE
-- input:
CREATE SEQUENCE my_seq
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / sequence.test: formats TEMPORARY/UNLOGGED sequence
-- input:
CREATE TEMP SEQUENCE my_seq START WITH 1
-- output:
CREATE TEMP SEQUENCE my_seq START
WITH
  1
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / sequence.test: formats TEMPORARY/UNLOGGED sequence
-- input:
CREATE UNLOGGED SEQUENCE my_seq START WITH 1
-- output:
CREATE UNLOGGED SEQUENCE my_seq START
WITH
  1
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / trigger.test: formats ALTER TRIGGER .. [NO] DEPENDS ON EXTENSION
-- input:
ALTER TRIGGER my_trigger ON my_table
DEPENDS ON EXTENSION ext_name
-- output:
ALTER TRIGGER my_trigger ON my_table DEPENDS ON EXTENSION ext_name
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / trigger.test: formats ALTER TRIGGER .. [NO] DEPENDS ON EXTENSION
-- input:
ALTER TRIGGER my_trigger ON my_table
NO DEPENDS ON EXTENSION ext_name
-- output:
ALTER TRIGGER my_trigger ON my_table NO DEPENDS ON EXTENSION ext_name
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / trigger.test: formats ALTER TRIGGER .. RENAME TO on multiple lines (if user prefers)
-- input:
ALTER TRIGGER my_trigger ON my_table
RENAME TO new_name
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / trigger.test: formats ALTER TRIGGER .. RENAME TO on single line
-- input:
ALTER TRIGGER my_trigger ON my_table RENAME TO new_name
-- output:
ALTER TRIGGER my_trigger ON my_table
RENAME TO new_name
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / trigger.test: formats CASCADE/RESTRICT
-- input:
DROP TRIGGER my_trigger ON my_table CASCADE
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / trigger.test: formats FROM clause
-- input:
CREATE CONSTRAINT TRIGGER my_trig
AFTER INSERT ON my_tbl
FROM schm.my_tbl
EXECUTE FUNCTION my_func()
-- output:
CREATE CONSTRAINT TRIGGER my_trig
AFTER INSERT ON my_tbl
FROM
  schm.my_tbl
EXECUTE FUNCTION my_func ()
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / trigger.test: formats long PostgreSQL EXECUTE FUNCTION syntax
-- input:
CREATE TRIGGER my_trig
AFTER TRUNCATE ON my_tbl
EXECUTE FUNCTION my_funtion_name(
  'first argument',
  'second argument',
  'third argument',
  'fourth argument'
)
-- output:
CREATE TRIGGER my_trig
AFTER
TRUNCATE ON my_tbl
EXECUTE FUNCTION my_funtion_name (
  'first argument',
  'second argument',
  'third argument',
  'fourth argument'
)
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / trigger.test: formats long referencing clause
-- input:
CREATE TRIGGER my_trig
AFTER INSERT ON my_tbl
REFERENCING
  OLD TABLE AS very_long_old_table,
  NEW ROW AS especially_long_new_row_name
EXECUTE FUNCTION my_func()
-- output:
CREATE TRIGGER my_trig
AFTER INSERT ON my_tbl REFERENCING OLD TABLE AS very_long_old_table,
NEW ROW AS especially_long_new_row_name
EXECUTE FUNCTION my_func ()
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / trigger.test: formats multiple events
-- input:
CREATE TRIGGER my_trig
AFTER INSERT OR UPDATE OF col1, col2 OR DELETE ON my_tbl
EXECUTE FUNCTION my_func()
-- output:
CREATE TRIGGER my_trig
AFTER INSERT
OR
UPDATE OF col1,
col2
OR DELETE ON my_tbl
EXECUTE FUNCTION my_func ()
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / trigger.test: formats OR REPLACE CONSTRAINT TRIGGER
-- input:
CREATE OR REPLACE CONSTRAINT TRIGGER my_trig
INSTEAD OF UPDATE ON my_tbl
EXECUTE FUNCTION fn()
-- output:
CREATE OR REPLACE CONSTRAINT TRIGGER my_trig INSTEAD OF
UPDATE ON my_tbl
EXECUTE FUNCTION fn ()
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / trigger.test: formats PostgreSQL EXECUTE FUNCTION syntax
-- input:
CREATE TRIGGER my_trig
AFTER TRUNCATE ON my_tbl
EXECUTE FUNCTION my_func(1, 2, 3, 'Hello')
-- output:
CREATE TRIGGER my_trig
AFTER
TRUNCATE ON my_tbl
EXECUTE FUNCTION my_func (1, 2, 3, 'Hello')
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / trigger.test: formats referencing clause
-- input:
CREATE TRIGGER my_trig
AFTER INSERT ON my_tbl
REFERENCING OLD TABLE AS old_table, NEW ROW AS ref_tbl_new
EXECUTE FUNCTION my_func()
-- output:
CREATE TRIGGER my_trig
AFTER INSERT ON my_tbl REFERENCING OLD TABLE AS old_table,
NEW ROW AS ref_tbl_new
EXECUTE FUNCTION my_func ()
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / trigger.test: formats timing clause
-- input:
CREATE TRIGGER my_trig
AFTER INSERT ON my_tbl
DEFERRABLE INITIALLY DEFERRED
EXECUTE FUNCTION my_func()
-- output:
CREATE TRIGGER my_trig
AFTER INSERT ON my_tbl DEFERRABLE INITIALLY DEFERRED
EXECUTE FUNCTION my_func ()
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / type.test: formats ALTER TYPE with multiple attribute actions
-- input:
ALTER TYPE vec3
ADD ATTRIBUTE x FLOAT,
ADD ATTRIBUTE y FLOAT COLLATE "C" CASCADE,
DROP ATTRIBUTE z,
DROP ATTRIBUTE IF EXISTS w RESTRICT,
ALTER ATTRIBUTE a SET DATA TYPE TEXT COLLATE "C" CASCADE
-- output:
ALTER TYPE vec3
ADD ATTRIBUTE x FLOAT,
ADD ATTRIBUTE y FLOAT COLLATE "C" CASCADE,
DROP ATTRIBUTE z,
DROP ATTRIBUTE IF EXISTS w RESTRICT,
ALTER ATTRIBUTE a
SET DATA TYPE TEXT COLLATE "C" CASCADE
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / type.test: formats CREATE TYPE ... AS (...)
-- input:
CREATE TYPE vec3 AS (x FLOAT, y FLOAT, z FLOAT)
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / type.test: formats CREATE TYPE ... AS (...) to multiple lines
-- input:
CREATE TYPE name AS (
  first_name TEXT COLLATE "C",
  middle_name TEXT COLLATE "C",
  last_name TEXT COLLATE "C"
)
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / type.test: formats CREATE TYPE ... AS (...) with collations
-- input:
CREATE TYPE name AS (first_name TEXT COLLATE "C", last_name TEXT COLLATE "C")
-- output:
CREATE TYPE name AS (
  first_name TEXT COLLATE "C",
  last_name TEXT COLLATE "C"
)
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / type.test: formats CREATE TYPE ... AS ENUM
-- input:
CREATE TYPE color AS ENUM ('red', 'green', 'blue')
-- output:
CREATE TYPE color AS ENUM('red', 'green', 'blue')
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / type.test: formats CREATE TYPE ... AS ENUM to multiple lines
-- input:
CREATE TYPE color AS ENUM (
  'red',
  'green',
  'blue',
  'yellow',
  'purple',
  'orange',
  'black',
  'white'
)
-- output:
CREATE TYPE color AS ENUM(
  'red',
  'green',
  'blue',
  'yellow',
  'purple',
  'orange',
  'black',
  'white'
)
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / type.test: formats CREATE TYPE name;
-- input:
CREATE TYPE foo
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / type.test: formats DROP TYPE
-- input:
DROP TYPE foo
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / type.test: formats DROP TYPE ... IF EXISTS ... CASCADE
-- input:
DROP TYPE IF EXISTS foo CASCADE
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / type.test: formats DROP TYPE with multiple names
-- input:
DROP TYPE foo, bar, baz
-- output:
DROP TYPE foo,
bar,
baz
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / view.test: formats CONCURRENTLY
-- input:
REFRESH MATERIALIZED VIEW CONCURRENTLY my_view
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / view.test: formats CREATE MATERIALIZED VIEW with extra PostgreSQL clauses
-- input:
CREATE MATERIALIZED VIEW foo
USING "SP-GiST"
WITH (fillfactor = 70)
TABLESPACE pg_default
AS
  SELECT 1
WITH NO DATA
-- output:
CREATE MATERIALIZED VIEW foo USING "SP-GiST"
WITH
  (fillfactor = 70) TABLESPACE pg_default AS
SELECT
  1
WITH
  NO DATA
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / view.test: formats CREATE TEMPORARY RECURSIVE VIEW IF NOT EXISTS
-- input:
CREATE TEMPORARY RECURSIVE VIEW IF NOT EXISTS active_client_id AS
  SELECT 1
-- output:
CREATE TEMPORARY RECURSIVE VIEW IF NOT EXISTS active_client_id AS
SELECT
  1
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / view.test: formats CREATE VIEW with PostgreSQL options
-- input:
CREATE VIEW foo
WITH (security_barrier = TRUE, check_option = local)
AS
  SELECT 1
WITH CASCADED CHECK OPTION
-- output:
CREATE VIEW foo
WITH
  (security_barrier = TRUE, check_option = local) AS
SELECT
  1
WITH
  CASCADED CHECK OPTION
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / view.test: formats multiple actions
-- input:
ALTER MATERIALIZED VIEW my_view
CLUSTER ON my_index,
SET WITHOUT CLUSTER,
OWNER TO my_role,
ALTER COLUMN foo SET STATISTICS 100,
ALTER COLUMN foo SET (n_distinct = 100),
ALTER COLUMN foo RESET (n_distinct),
ALTER COLUMN foo SET STORAGE PLAIN,
ALTER COLUMN foo SET COMPRESSION my_method
-- output:
ALTER MATERIALIZED VIEW my_view
CLUSTER ON my_index,
SET
  WITHOUT
CLUSTER,
OWNER TO my_role,
ALTER COLUMN foo
SET
  STATISTICS 100,
ALTER COLUMN foo
SET
  (n_distinct = 100),
ALTER COLUMN foo
RESET (n_distinct),
ALTER COLUMN foo
SET
  STORAGE PLAIN,
ALTER COLUMN foo
SET
  COMPRESSION my_method
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / view.test: formats REFRESH MATERIALIZED VIEW
-- input:
REFRESH MATERIALIZED VIEW my_view
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / view.test: formats WITH [NO] DATA ... on one or multiple lines
-- input:
REFRESH MATERIALIZED VIEW my_view
WITH NO DATA
-- output:
REFRESH MATERIALIZED VIEW my_view
WITH
  NO DATA
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / view.test: formats WITH [NO] DATA ... on one or multiple lines
-- input:
REFRESH MATERIALIZED VIEW my_view WITH DATA
-- output:
REFRESH MATERIALIZED VIEW my_view
WITH
  DATA
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dml / insert.test: formats INSERT with OVERRIDING clause
-- input:
INSERT INTO client
OVERRIDING SYSTEM VALUE
VALUES (1, 'John')
-- output:
INSERT INTO
  client
OVERRIDING SYSTEM VALUE
VALUES
  (1, 'John')
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dml / insert.test: formats upsert clause with ON CONSTRAINT
-- input:
INSERT INTO client
VALUES (1, 2, 3)
ON CONFLICT ON CONSTRAINT client_pkey DO NOTHING
-- output:
INSERT INTO
  client
VALUES
  (1, 2, 3)
ON CONFLICT ON CONSTRAINT client_pkey DO NOTHING
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dml / merge.test: formats INSERT .. OVERRIDING clause
-- input:
MERGE INTO target
USING source
ON target.id = source.id
WHEN NOT MATCHED THEN
  INSERT
    (col1, col2, col3)
  OVERRIDING USER VALUE
  VALUES
    (1000, 2000, 3000)
-- output:
MERGE INTO target USING source ON target.id = source.id WHEN NOT MATCHED THEN INSERT (col1, col2, col3) OVERRIDING USER VALUE
VALUES
  (1000, 2000, 3000)
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dml / merge.test: formats MERGE .. DO NOTHING
-- input:
MERGE INTO target
USING source
ON target.id = source.id
WHEN NOT MATCHED THEN
  DO NOTHING
-- output:
MERGE INTO target USING source ON target.id = source.id WHEN NOT MATCHED THEN DO NOTHING
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dml / truncate.test: formats {CASCADE | RESTRICT}
-- input:
TRUNCATE TABLE dataset.employee CASCADE
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dml / truncate.test: formats {RESTART | CONTINUE} IDENTITY
-- input:
TRUNCATE TABLE dataset.employee RESTART IDENTITY
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dml / truncate.test: formats multi-table truncate with modifiers
-- input:
TRUNCATE TABLE
  dataset.employee,
  dataset.manager,
  dataset.department,
  dataset.company
  CONTINUE IDENTITY
  RESTRICT
-- output:
TRUNCATE TABLE dataset.employee,
dataset.manager,
dataset.department,
dataset.company CONTINUE IDENTITY RESTRICT
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dml / update.test: formats UPDATE with WHERE CURRENT OF clause
-- input:
UPDATE client
SET status = 2
WHERE CURRENT OF cursor_name
-- output:
UPDATE client
SET
  status = 2
WHERE CURRENT OF cursor_name
-- #endregion

-- #region: prettier-plugin-sql-cst / test / explain.test: formats EXPLAIN ANALYZE statement
-- input:
EXPLAIN ANALYZE SELECT 1
-- output:
EXPLAIN
ANALYZE
SELECT
  1
-- #endregion

-- #region: prettier-plugin-sql-cst / test / expr / expr.test: formats :: cast operator without spaces
-- input:
SELECT 256::INTEGER
-- output:
SELECT
  256::INTEGER
-- #endregion

-- #region: prettier-plugin-sql-cst / test / expr / expr.test: formats array constructors
-- input:
SELECT ARRAY(SELECT x FROM tbl)
-- output:
SELECT
  ARRAY(
    SELECT
      x
    FROM
      tbl
  )
-- #endregion

-- #region: prettier-plugin-sql-cst / test / expr / expr.test: formats array slice
-- input:
SELECT my_arr[5:10], my_arr[:8], my_arr[3:], my_arr[:]
-- output:
SELECT
  my_arr[5:10],
  my_arr[:8],
  my_arr[3:],
  my_arr[:]
-- #endregion

-- #region: prettier-plugin-sql-cst / test / expr / expr.test: formats array subscript
-- input:
SELECT my_arr[1][2]
-- output:
SELECT
  my_arr[1] [2]
-- #endregion

-- #region: prettier-plugin-sql-cst / test / expr / expr.test: formats OPERATOR()
-- input:
SELECT 5 OPERATOR(+) 6
-- output:
SELECT
  5 OPERATOR(+) 6
-- #endregion

-- #region: prettier-plugin-sql-cst / test / expr / expr.test: formats OPERATOR()
-- input:
SELECT x OPERATOR(my_schema.>>) y FROM tbl
-- output:
SELECT
  x OPERATOR(my_schema.>>) y
FROM
  tbl
-- #endregion

-- #region: prettier-plugin-sql-cst / test / expr / expr.test: formats quantifier expressions
-- input:
SELECT x > ALL (SELECT y FROM tbl)
-- output:
SELECT
  x > ALL (
    SELECT
      y
    FROM
      tbl
  )
-- #endregion

-- #region: prettier-plugin-sql-cst / test / expr / expr.test: formats row constructors
-- input:
SELECT ROW(1, 2, 3)
-- output:
SELECT
  ROW (1, 2, 3)
-- #endregion

-- #region: prettier-plugin-sql-cst / test / expr / json.test: formats JSONB literal using Prettier JSONB formatter
-- input:
SELECT JSONB '{"fname":"John","lname":"Doe","valid":true}'
-- output:
SELECT
  JSONB '{"fname":"John","lname":"Doe","valid":true}'
-- #endregion

-- #region: prettier-plugin-sql-cst / test / expr / json.test: formats JSONB literals
-- input:
SELECT JSONB '{ "foo": true }'
-- output:
SELECT
  JSONB '{ "foo": true }'
-- #endregion

-- #region: prettier-plugin-sql-cst / test / expr / literal.test: formats PostgreSQL array literals
-- input:
SELECT
  ARRAY[1, 2, 3],
  ARRAY[
    'a somewhat large array',
    'containing some strings',
    'which themselves',
    'are somewhat long.'
  ]
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / expr / literal.test: formats PostgreSQL INTERVAL literals
-- input:
SELECT
  INTERVAL '1 day',
  INTERVAL (3) '25 second',
  INTERVAL '25' SECOND (15),
  INTERVAL '30:25' MINUTE TO SECOND (15),
  INTERVAL '30:25' MINUTE TO SECOND
-- output:
SELECT
  INTERVAL '1 day',
  INTERVAL(3) '25 second',
  INTERVAL '25' SECOND (15),
  INTERVAL '30:25' MINUTE TO SECOND (15),
  INTERVAL '30:25' MINUTE TO SECOND
-- #endregion

-- #region: prettier-plugin-sql-cst / test / options / functionCase.test: changes case of function name in CREATE TRIGGER
-- input:

        CREATE TRIGGER my_trig
        AFTER TRUNCATE ON my_tbl
        EXECUTE FUNCTION my_func(1, 2, 3)
      
-- output:
CREATE TRIGGER my_trig
AFTER
TRUNCATE ON my_tbl
EXECUTE FUNCTION my_func (1, 2, 3)
-- #endregion

-- #region: prettier-plugin-sql-cst / test / options / functionCase.test: changes case of qualified function name in CREATE TRIGGER
-- input:

        CREATE TRIGGER my_trig
        AFTER TRUNCATE ON my_tbl
        EXECUTE FUNCTION schm.my_func(1, 2, 3)
      
-- output:
CREATE TRIGGER my_trig
AFTER
TRUNCATE ON my_tbl
EXECUTE FUNCTION schm.my_func (1, 2, 3)
-- #endregion

-- #region: prettier-plugin-sql-cst / test / options / literalCase.test: sqlLiteralCase effects ON/OFF values in PostgreSQL SET statements
-- config: {"keywordCase":"upper"}
-- input:
set log_statement = OFF
-- output:
SET
  log_statement = OFF
-- #endregion

-- #region: prettier-plugin-sql-cst / test / options / literalCase.test: sqlLiteralCase effects ON/OFF values in PostgreSQL SET statements
-- config: {"keywordCase":"lower"}
-- input:
set log_statement = on
-- output:
set
  log_statement = on
-- #endregion

-- #region: prettier-plugin-sql-cst / test / options / typeCase.test: applies to INTERVAL data type
-- input:
CREATE TABLE t (x INTERVAL DAY TO MINUTE)
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / options / typeCase.test: applies to TIME data type
-- input:
CREATE TABLE t (x TIMESTAMP WITH TIME ZONE)
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / options / typeCase.test: does not apply to ARRAY[] literals in PostgreSQL
-- input:
SELECT ARRAY[1, 2, 3]
-- output:
SELECT
  ARRAY[1, 2, 3]
-- #endregion

-- #region: prettier-plugin-sql-cst / test / options / typeCase.test: does not apply to SETOF data types
-- input:
CREATE TABLE t (x SETOF INT)
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / options / typeCase.test: does not apply to TABLE data type
-- input:
CREATE FUNCTION foo() RETURNS TABLE (id INT) AS ''
-- output:
CREATE FUNCTION foo () RETURNS TABLE (id INT) AS ''
-- #endregion

-- #region: prettier-plugin-sql-cst / test / postgresql / comment.test: formats long COMMENT ON
-- input:
COMMENT ON CONSTRAINT constraint_name ON DOMAIN domain_name IS
  'This is a really nice comment here.'
-- output:
COMMENT ON CONSTRAINT constraint_name ON DOMAIN domain_name IS 'This is a really nice comment here.'
-- #endregion

-- #region: prettier-plugin-sql-cst / test / postgresql / comment.test: formats long comment target
-- input:
COMMENT ON FUNCTION my_absolutely_fantastic_function(
  IN whoopsie CHARACTER VARYING,
  OUT doopsie TEXT
) IS
  'This is a really nice comment here.'
-- output:
COMMENT ON FUNCTION my_absolutely_fantastic_function (IN whoopsie CHARACTER VARYING, OUT doopsie TEXT) IS 'This is a really nice comment here.'
-- #endregion

-- #region: prettier-plugin-sql-cst / test / postgresql / comment.test: formats multi-line comment
-- input:
COMMENT ON TABLE foo IS
  'This is a multi-line comment,
  that spans several lines.
  In here.'
-- output:
COMMENT ON TABLE foo IS 'This is a multi-line comment,
  that spans several lines.
  In here.'
-- #endregion

-- #region: prettier-plugin-sql-cst / test / postgresql / comment.test: formats short COMMENT ON
-- input:
COMMENT ON TABLE revenue IS 'Hello, world!'
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / postgresql / do.test: formats DO [LANGUAGE <language>]
-- input:
DO LANGUAGE plpgsql 'SELECT 1;'
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / postgresql / do.test: formats DO statement
-- input:
DO $$
  BEGIN
    PERFORM proc_name(arg1, arg2, arg3);
  END
$$
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / postgresql / extension.test: formats CREATE EXTENSION
-- input:
CREATE EXTENSION my_extension
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / postgresql / extension.test: formats DROP EXTENSION
-- input:
DROP EXTENSION IF EXISTS ext1, ext2 CASCADE
-- output:
DROP EXTENSION IF EXISTS ext1,
ext2 CASCADE
-- #endregion

-- #region: prettier-plugin-sql-cst / test / postgresql / extension.test: formats long CREATE EXTENSION
-- input:
CREATE EXTENSION IF NOT EXISTS my_extension
  WITH SCHEMA my_schema VERSION '1.0' CASCADE
-- output:
CREATE EXTENSION IF NOT EXISTS my_extension
WITH
  SCHEMA my_schema VERSION '1.0' CASCADE
-- #endregion

-- #region: prettier-plugin-sql-cst / test / postgresql / extension.test: formats long CREATE EXTENSION on single line
-- input:
CREATE EXTENSION IF NOT EXISTS my_extension SCHEMA my_schema
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / postgresql / parameter.test: formats RESET ALL
-- input:
RESET ALL
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / postgresql / parameter.test: formats RESET statement
-- input:
RESET work_mem
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / postgresql / parameter.test: formats SET [LOCAL] statement
-- input:
SET LOCAL max_connections = 200
-- output:
SET
  LOCAL max_connections = 200
-- #endregion

-- #region: prettier-plugin-sql-cst / test / postgresql / parameter.test: formats SET [SESSION] TIME ZONE LOCAL
-- input:
SET SESSION TIME ZONE LOCAL
-- output:
SET
  SESSION TIME ZONE LOCAL
-- #endregion

-- #region: prettier-plugin-sql-cst / test / postgresql / parameter.test: formats SET statement
-- input:
SET work_mem TO '64MB'
-- output:
SET
  work_mem TO '64MB'
-- #endregion

-- #region: prettier-plugin-sql-cst / test / postgresql / parameter.test: formats SET TIME ZONE statement
-- input:
SET TIME ZONE 'UTC'
-- output:
SET
  TIME ZONE 'UTC'
-- #endregion

-- #region: prettier-plugin-sql-cst / test / postgresql / parameter.test: formats SET with ON/OFF values
-- input:
SET log_statement = OFF
-- output:
SET
  log_statement = OFF
-- #endregion

-- #region: prettier-plugin-sql-cst / test / postgresql / parameter.test: formats SET with ON/OFF values
-- input:
SET log_statement TO ON
-- output:
SET
  log_statement TO ON
-- #endregion

-- #region: prettier-plugin-sql-cst / test / postgresql / parameter.test: formats SHOW ALL
-- input:
SHOW ALL
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / postgresql / parameter.test: formats SHOW statement
-- input:
SHOW work_mem
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / postgresql / publication.test: formats ADD publication_object, ...
-- input:
ALTER PUBLICATION my_publication ADD TABLE foo, TABLES IN SCHEMA bar
-- output:
ALTER PUBLICATION my_publication
ADD TABLE foo,
TABLES IN SCHEMA bar
-- #endregion

-- #region: prettier-plugin-sql-cst / test / postgresql / publication.test: formats CREATE PUBLICATION
-- input:
CREATE PUBLICATION my_publication
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / postgresql / publication.test: formats DROP PUBLICATION
-- input:
DROP PUBLICATION IF EXISTS my_publication1, my_publication2 CASCADE
-- output:
DROP PUBLICATION IF EXISTS my_publication1,
my_publication2 CASCADE
-- #endregion

-- #region: prettier-plugin-sql-cst / test / postgresql / publication.test: formats DROP PUBLICATION
-- input:
DROP PUBLICATION my_publication
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / postgresql / publication.test: formats DROP publication_object, ...
-- input:
ALTER PUBLICATION my_publication DROP TABLE foo, TABLES IN SCHEMA bar
-- output:
ALTER PUBLICATION my_publication
DROP TABLE foo,
TABLES IN SCHEMA bar
-- #endregion

-- #region: prettier-plugin-sql-cst / test / postgresql / publication.test: formats FOR ALL TABLES/SEQUENCES
-- input:
CREATE PUBLICATION my_publication FOR ALL SEQUENCES
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / postgresql / publication.test: formats FOR ALL TABLES/SEQUENCES
-- input:
CREATE PUBLICATION my_publication FOR ALL TABLES
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / postgresql / publication.test: formats FOR ALL TABLES/SEQUENCES
-- input:
CREATE PUBLICATION my_publication_name_that_is_extra_long FOR
  ALL TABLES,
  ALL SEQUENCES
-- output:
CREATE PUBLICATION my_publication_name_that_is_extra_long FOR ALL TABLES,
ALL SEQUENCES
-- #endregion

-- #region: prettier-plugin-sql-cst / test / postgresql / publication.test: formats FOR TABLE
-- input:
CREATE PUBLICATION my_publication FOR
  TABLE foo (column1, column2) WHERE (id > 10)
-- output:
CREATE PUBLICATION my_publication FOR TABLE foo (column1, column2)
WHERE
  (id > 10)
-- #endregion

-- #region: prettier-plugin-sql-cst / test / postgresql / publication.test: formats FOR TABLE
-- input:
CREATE PUBLICATION my_publication FOR TABLE foo
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / postgresql / publication.test: formats FOR TABLE
-- input:
CREATE PUBLICATION my_publication FOR TABLE foo (column1, column2)
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / postgresql / publication.test: formats FOR TABLES IN SCHEMA
-- input:
CREATE PUBLICATION my_publication FOR
  TABLES IN SCHEMA my_long_schema_name_in_here
-- output:
CREATE PUBLICATION my_publication FOR TABLES IN SCHEMA my_long_schema_name_in_here
-- #endregion

-- #region: prettier-plugin-sql-cst / test / postgresql / publication.test: formats FOR TABLES IN SCHEMA
-- input:
CREATE PUBLICATION my_publication FOR TABLES IN SCHEMA my_schema
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / postgresql / publication.test: formats multiple FOR clauses
-- input:
CREATE PUBLICATION my_publication FOR
  TABLES IN SCHEMA my_long_schema_name_in_here,
  TABLE foo (column1, column2) WHERE (id > 10)
-- output:
CREATE PUBLICATION my_publication FOR TABLES IN SCHEMA my_long_schema_name_in_here,
TABLE foo (column1, column2)
WHERE
  (id > 10)
-- #endregion

-- #region: prettier-plugin-sql-cst / test / postgresql / publication.test: formats multiple publication objects to multiple lines
-- input:
ALTER PUBLICATION my_long_publication_name
DROP
  TABLE first_table_name,
  TABLES IN SCHEMA my_schema_name,
  TABLE second_table_name
-- output:
ALTER PUBLICATION my_long_publication_name
DROP TABLE first_table_name,
TABLES IN SCHEMA my_schema_name,
TABLE second_table_name
-- #endregion

-- #region: prettier-plugin-sql-cst / test / postgresql / publication.test: formats OWNER TO
-- input:
ALTER PUBLICATION my_publication OWNER TO new_owner
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / postgresql / publication.test: formats RENAME TO
-- input:
ALTER PUBLICATION my_publication RENAME TO new_name
-- output:
ALTER PUBLICATION my_publication
RENAME TO new_name
-- #endregion

-- #region: prettier-plugin-sql-cst / test / postgresql / publication.test: formats SET (...)
-- input:
ALTER PUBLICATION my_publication SET (param = 'value')
-- output:
ALTER PUBLICATION my_publication
SET
  (param = 'value')
-- #endregion

-- #region: prettier-plugin-sql-cst / test / postgresql / publication.test: formats SET publication_object, ...
-- input:
ALTER PUBLICATION my_publication SET TABLE foo, TABLES IN SCHEMA bar
-- output:
ALTER PUBLICATION my_publication
SET
  TABLE foo,
  TABLES IN SCHEMA bar
-- #endregion

-- #region: prettier-plugin-sql-cst / test / postgresql / publication.test: formats to multiple lines when long
-- input:
ALTER PUBLICATION my_publication
DROP TABLE foo, TABLES IN SCHEMA bar, TABLE baz
-- output:
ALTER PUBLICATION my_publication
DROP TABLE foo,
TABLES IN SCHEMA bar,
TABLE baz
-- #endregion

-- #region: prettier-plugin-sql-cst / test / postgresql / publication.test: formats to multiple lines when user prefers
-- input:
ALTER PUBLICATION my_pub
ADD TABLE foo
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / postgresql / publication.test: formats WITH clause
-- input:
CREATE PUBLICATION my_publication FOR
  TABLES IN SCHEMA my_long_schema_name_in_here
WITH (publish = 'insert, update')
-- output:
CREATE PUBLICATION my_publication FOR TABLES IN SCHEMA my_long_schema_name_in_here
WITH
  (publish = 'insert, update')
-- #endregion

-- #region: prettier-plugin-sql-cst / test / postgresql / publication.test: formats WITH clause
-- input:
CREATE PUBLICATION my_publication FOR ALL TABLES WITH (publish = '')
-- output:
CREATE PUBLICATION my_publication FOR ALL TABLES
WITH
  (publish = '')
-- #endregion

-- #region: prettier-plugin-sql-cst / test / postgresql / subscription.test: formats CREATE SUBSCRIPTION to multiple lines
-- input:
CREATE SUBSCRIPTION my_subscription
CONNECTION 'host=192.168.1.50 port=5432 user=foo dbname=foodb'
PUBLICATION my_publication
-- output:
CREATE SUBSCRIPTION my_subscription CONNECTION 'host=192.168.1.50 port=5432 user=foo dbname=foodb' PUBLICATION my_publication
-- #endregion

-- #region: prettier-plugin-sql-cst / test / postgresql / subscription.test: formats CREATE SUBSCRIPTION to single line if fits
-- input:
CREATE SUBSCRIPTION my_sub CONNECTION 'con' PUBLICATION my_pub
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / postgresql / subscription.test: formats DROP SUBSCRIPTION
-- input:
DROP SUBSCRIPTION IF EXISTS my_sub CASCADE
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / postgresql / subscription.test: formats WITH clause
-- input:
CREATE SUBSCRIPTION my_subscription
CONNECTION 'host=192.168.1.50 port=5432 user=foo dbname=foodb'
PUBLICATION my_publication
WITH (param1 = 1, param2 = 2)
-- output:
CREATE SUBSCRIPTION my_subscription CONNECTION 'host=192.168.1.50 port=5432 user=foo dbname=foodb' PUBLICATION my_publication
WITH
  (param1 = 1, param2 = 2)
-- #endregion

-- #region: prettier-plugin-sql-cst / test / proc / prepared_statements.test: formats DEALLOCATE ALL
-- input:
DEALLOCATE ALL
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / proc / prepared_statements.test: formats DEALLOCATE PREPARE name
-- input:
DEALLOCATE PREPARE my_statement
-- output:
DEALLOCATE
PREPARE my_statement
-- #endregion

-- #region: prettier-plugin-sql-cst / test / proc / prepared_statements.test: formats EXECUTE name
-- input:
EXECUTE my_prepared_stmt
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / proc / prepared_statements.test: formats EXECUTE name(...long argument list)
-- input:
EXECUTE my_prepared_stmt(
  1,
  'some text',
  3.14,
  TRUE,
  NULL,
  'another text',
  42,
  FALSE
)
-- output:
EXECUTE my_prepared_stmt (
  1,
  'some text',
  3.14,
  TRUE,
  NULL,
  'another text',
  42,
  FALSE
)
-- #endregion

-- #region: prettier-plugin-sql-cst / test / proc / prepared_statements.test: formats EXECUTE name(args)
-- input:
EXECUTE my_prepared_stmt(1, 'some text')
-- output:
EXECUTE my_prepared_stmt (1, 'some text')
-- #endregion

-- #region: prettier-plugin-sql-cst / test / proc / prepared_statements.test: formats PREPARE name (...long parameter list)
-- input:
PREPARE my_statement(
  INTEGER,
  VARCHAR(200),
  BOOLEAN,
  TIMESTAMP WITH TIME ZONE
) AS
  SELECT $1, $2, $3, $4
-- output:
PREPARE my_statement (
  INTEGER,
  VARCHAR(200),
  BOOLEAN,
  TIMESTAMP WITH TIME ZONE
) AS
SELECT
  $1,
  $2,
  $3,
  $4
-- #endregion

-- #region: prettier-plugin-sql-cst / test / proc / prepared_statements.test: formats PREPARE name (...params)
-- input:
PREPARE my_statement(INT, TEXT, TIMESTAMP) AS
  SELECT $1, $2, $3
-- output:
PREPARE my_statement (INT, TEXT, TIMESTAMP) AS
SELECT
  $1,
  $2,
  $3
-- #endregion

-- #region: prettier-plugin-sql-cst / test / proc / prepared_statements.test: formats PREPARE name AS statement
-- input:
PREPARE my_statement AS
  SELECT 1, 2, 3
-- output:
PREPARE my_statement AS
SELECT
  1,
  2,
  3
-- #endregion

-- #region: prettier-plugin-sql-cst / test / select / for.test: formats basic FOR clause
-- input:
SELECT 1 FOR NO KEY UPDATE
-- output:
SELECT
  1
FOR NO KEY UPDATE
-- #endregion

-- #region: prettier-plugin-sql-cst / test / select / for.test: formats basic FOR clause
-- input:
SELECT 1 FOR UPDATE
-- output:
SELECT
  1
FOR UPDATE
-- #endregion

-- #region: prettier-plugin-sql-cst / test / select / for.test: formats FOR clause with long list of tables
-- input:
SELECT 1
FOR SHARE OF
  very_long_table_name1,
  very_long_table_name2,
  very_long_table_name3
  NOWAIT
-- output:
SELECT
  1
FOR SHARE OF
  very_long_table_name1,
  very_long_table_name2,
  very_long_table_name3 NOWAIT
-- #endregion

-- #region: prettier-plugin-sql-cst / test / select / for.test: formats FOR clause with tables and modifiers
-- input:
SELECT 1
FOR SHARE OF table1, table2 SKIP LOCKED
-- output:
SELECT
  1
FOR SHARE OF
  table1,
  table2 SKIP LOCKED
-- #endregion

-- #region: prettier-plugin-sql-cst / test / select / from.test: formats LATERAL table function
-- input:
SELECT *
FROM LATERAL schm.foo(1, 2, 3) AS t
-- output:
SELECT
  *
FROM
  LATERAL schm.foo (1, 2, 3) AS t
-- #endregion

-- #region: prettier-plugin-sql-cst / test / select / from.test: formats ONLY table
-- input:
SELECT * FROM ONLY my_table
-- output:
SELECT
  *
FROM
  ONLY my_table
-- #endregion

-- #region: prettier-plugin-sql-cst / test / select / from.test: formats ROWS FROM
-- input:
SELECT * FROM ROWS FROM (fn1(), fn2())
-- output:
SELECT
  *
FROM
  ROWS
FROM
  (fn1 (), fn2 ())
-- #endregion

-- #region: prettier-plugin-sql-cst / test / select / from.test: formats ROWS FROM with column definitions
-- input:
SELECT *
FROM
  ROWS FROM (
    table_function1(foo, bar) AS (a INT, b TEXT),
    table_function2(foo, bar, baz) AS (a INT, b TEXT, c TEXT)
  )
-- output:
SELECT
  *
FROM
  ROWS
FROM
  (
    table_function1 (foo, bar) AS (a INT, b TEXT),
    table_function2 (foo, bar, baz) AS (a INT, b TEXT, c TEXT)
  )
-- #endregion

-- #region: prettier-plugin-sql-cst / test / select / from.test: formats table *
-- input:
SELECT * FROM my_table *
-- output:
SELECT
  *
FROM
  my_table *
-- #endregion

-- #region: prettier-plugin-sql-cst / test / select / from.test: formats table alias with column aliases
-- input:
SELECT *
FROM
  standard_client AS client (id, name)
  JOIN standard_client_sale AS sale (client_id, sale_id)
    ON sale.client_id = client.id
-- output:
SELECT
  *
FROM
  standard_client AS client (id, name)
  JOIN standard_client_sale AS sale (client_id, sale_id) ON sale.client_id = client.id
-- #endregion

-- #region: prettier-plugin-sql-cst / test / select / from.test: formats table functions WITH ORDINALITY
-- input:
SELECT *
FROM
  table_func1() WITH ORDINALITY
  JOIN ROWS FROM (table_func2(), table_func3()) WITH ORDINALITY
-- output:
SELECT
  *
FROM
  table_func1 () WITH ORDINALITY
  JOIN ROWS
FROM
  (table_func2 (), table_func3 ()) WITH ORDINALITY
-- #endregion

-- #region: prettier-plugin-sql-cst / test / select / from.test: formats TABLESPAMPLE with custom sampling function and multiple parameters
-- input:
SELECT * FROM my_table TABLESAMPLE my_sampler (10, 20)
-- output:
SELECT
  *
FROM
  my_table TABLESAMPLE my_sampler (10, 20)
-- #endregion

-- #region: prettier-plugin-sql-cst / test / select / from.test: formats TABLESPAMPLE with REPEATABLE clause
-- input:
SELECT * FROM my_table TABLESAMPLE BERNOULLI (5) REPEATABLE (123)
-- output:
SELECT
  *
FROM
  my_table TABLESAMPLE BERNOULLI (5) REPEATABLE (123)
-- #endregion

-- #region: prettier-plugin-sql-cst / test / select / into.test: formats INTO TABLE clause
-- input:
SELECT * FROM tbl INTO my_table
-- output:
SELECT
  *
FROM
  tbl INTO my_table
-- #endregion

-- #region: prettier-plugin-sql-cst / test / select / into.test: formats INTO TABLE clause
-- input:
SELECT 1
INTO TEMPORARY TABLE my_table
-- output:
SELECT
  1 INTO TEMPORARY TABLE my_table
-- #endregion

-- #region: prettier-plugin-sql-cst / test / select / into.test: formats INTO TABLE clause
-- input:
SELECT 1
INTO UNLOGGED TABLE my_table
-- output:
SELECT
  1 INTO UNLOGGED TABLE my_table
-- #endregion

-- #region: prettier-plugin-sql-cst / test / select / limiting.test: formats LIMIT ALL
-- input:
SELECT * FROM tbl LIMIT ALL
-- output:
SELECT
  *
FROM
  tbl
LIMIT
  ALL
-- #endregion

-- #region: prettier-plugin-sql-cst / test / select / limiting.test: formats OFFSET and FETCH clauses
-- input:
SELECT *
FROM tbl
OFFSET 1000 ROWS
FETCH FIRST 100 ROWS ONLY
-- output:
SELECT
  *
FROM
  tbl
OFFSET
  1000 ROWS
FETCH FIRST
  100 ROWS ONLY
-- #endregion

-- #region: prettier-plugin-sql-cst / test / select / limiting.test: formats OFFSET clause
-- input:
SELECT * FROM tbl OFFSET 1000
-- output:
SELECT
  *
FROM
  tbl
OFFSET
  1000
-- #endregion

-- #region: prettier-plugin-sql-cst / test / select / limiting.test: formats OFFSET with long expressions
-- config: {"expressionWidth":30}
-- input:
SELECT *
FROM tbl
OFFSET
  (20500 + 5200 / 82) ROWS
-- output:
SELECT
  *
FROM
  tbl
OFFSET
  (20500 + 5200 / 82) ROWS
-- #endregion

-- #region: prettier-plugin-sql-cst / test / select / limiting.test: formats single-line OFFSET and FETCH clauses
-- input:
SELECT *
FROM tbl
OFFSET 1 ROW
FETCH NEXT ROW WITH TIES
-- output:
SELECT
  *
FROM
  tbl
OFFSET
  1 ROW
FETCH NEXT
  ROW
WITH
  TIES
-- #endregion

-- #region: prettier-plugin-sql-cst / test / select / select.test: formats empty SELECT
-- input:
SELECT
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / select / select.test: formats empty SELECT
-- input:
SELECT FROM tbl
-- output:
SELECT
FROM
  tbl
-- #endregion

-- #region: prettier-plugin-sql-cst / test / select / select.test: formats GROUP BY CUBE()
-- input:
SELECT * FROM tbl GROUP BY CUBE(a)
-- output:
SELECT
  *
FROM
  tbl
GROUP BY
  CUBE (a)
-- #endregion

-- #region: prettier-plugin-sql-cst / test / select / select.test: formats GROUP BY DISTINCT
-- input:
SELECT * FROM tbl GROUP BY DISTINCT a, b
-- output:
SELECT
  *
FROM
  tbl
GROUP BY DISTINCT
  a,
  b
-- #endregion

-- #region: prettier-plugin-sql-cst / test / select / select.test: formats GROUP BY GROUPING SETS ()
-- input:
SELECT * FROM tbl GROUP BY GROUPING SETS (foo, CUBE(bar), ())
-- output:
SELECT
  *
FROM
  tbl
GROUP BY
  GROUPING SETS (foo, CUBE (bar), ())
-- #endregion

-- #region: prettier-plugin-sql-cst / test / select / select.test: formats ORDER BY col USING operator
-- input:
SELECT * FROM tbl ORDER BY col USING >
-- output:
SELECT
  *
FROM
  tbl
ORDER BY
  col USING >
-- #endregion

-- #region: prettier-plugin-sql-cst / test / select / select.test: formats PostgreSQL SELECT DISTINCT ON ()
-- input:
SELECT DISTINCT ON (col1, col2)
  col1,
  col2,
  col3
FROM tbl
-- output:
SELECT DISTINCT
  ON (col1, col2) col1,
  col2,
  col3
FROM
  tbl
-- #endregion

-- #region: prettier-plugin-sql-cst / test / select / table.test: formats TABLE statement (syntax sugar for SELECT)
-- input:
TABLE my_table
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / select / table.test: formats TABLE statement (syntax sugar for SELECT)
-- input:
WITH my_table AS (SELECT 1 AS col1)
TABLE my_table
ORDER BY col1
-- output:
WITH
  my_table AS (
    SELECT
      1 AS col1
  ) TABLE my_table
ORDER BY
  col1
-- #endregion

-- #region: prettier-plugin-sql-cst / test / select / with.test: formats CYCLE and SEARCH clauses in WITH
-- input:
WITH RECURSIVE
  cte1 AS (SELECT * FROM my_table WHERE x > 0)
    CYCLE a, b SET a TO 1 DEFAULT 0 USING pathcol,
  cte2 AS (
    SELECT *
    FROM client
    WHERE age > 100
  ) SEARCH BREADTH FIRST BY a, b SET target_col
SELECT *
FROM
  cte1,
  cte2
-- output:
WITH RECURSIVE
  cte1 AS (
    SELECT
      *
    FROM
      my_table
    WHERE
      x > 0
  ) CYCLE a,
  b
SET
  a TO 1 DEFAULT 0 USING pathcol,
  cte2 AS (
    SELECT
      *
    FROM
      client
    WHERE
      age > 100
  ) SEARCH BREADTH FIRST BY a,
  b
SET
  target_col
SELECT
  *
FROM
  cte1,
  cte2
-- #endregion

-- #region: prettier-plugin-sql-cst / test / select / with.test: formats long CYCLE and SEARCH clauses in WITH
-- input:
WITH RECURSIVE
  cte1 AS (SELECT * FROM tbl)
    CYCLE
      first_long_column_name,
      second_really_long_column_name,
      third_column_name_as_well
    SET target_column_name
    USING path_column_name,
  cte2 AS (SELECT * FROM tbl)
    CYCLE col1, col2
    SET target_column_name
    TO 'Found it here in the cycle'
    DEFAULT 'No cycle found'
    USING path_column_name,
  cte3 AS (SELECT * FROM tbl)
    SEARCH DEPTH FIRST BY
      first_long_column_name,
      second_really_long_column_name,
      third_column_name_as_well
    SET target_column_name
SELECT *
FROM
  cte1,
  cte2,
  cte3
-- output:
WITH RECURSIVE
  cte1 AS (
    SELECT
      *
    FROM
      tbl
  ) CYCLE first_long_column_name,
  second_really_long_column_name,
  third_column_name_as_well
SET
  target_column_name USING path_column_name,
  cte2 AS (
    SELECT
      *
    FROM
      tbl
  ) CYCLE col1,
  col2
SET
  target_column_name TO 'Found it here in the cycle' DEFAULT 'No cycle found' USING path_column_name,
  cte3 AS (
    SELECT
      *
    FROM
      tbl
  ) SEARCH DEPTH FIRST BY first_long_column_name,
  second_really_long_column_name,
  third_column_name_as_well
SET
  target_column_name
SELECT
  *
FROM
  cte1,
  cte2,
  cte3
-- #endregion

-- #region: prettier-plugin-sql-cst / test / transaction.test: formats AND [NO] CHAIN clauses
-- input:
START TRANSACTION;

ROLLBACK AND NO CHAIN;

COMMIT AND CHAIN
-- output:
START TRANSACTION;

ROLLBACK
AND NO CHAIN;

COMMIT
AND CHAIN
-- #endregion

-- #region: prettier-plugin-sql-cst / test / transaction.test: formats BEGIN TRANSACTION .. END TRANSACTION
-- input:
BEGIN TRANSACTION;

END TRANSACTION
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / transaction.test: formats BEGIN WORK .. END WORK
-- input:
BEGIN WORK;

END WORK
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / transaction.test: formats transaction modes
-- input:
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE, READ ONLY, DEFERRABLE;

COMMIT
-- output:
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE,
READ ONLY,
DEFERRABLE;

COMMIT
-- #endregion

-- #region: prettier-plugin-sql-cst / test / transaction.test: formats transaction modes on multiple lines
-- input:
BEGIN TRANSACTION
  ISOLATION LEVEL READ COMMITTED,
  READ WRITE,
  NOT DEFERRABLE,
  ISOLATION LEVEL REPEATABLE READ;

COMMIT
-- output:
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED,
READ WRITE,
NOT DEFERRABLE,
ISOLATION LEVEL REPEATABLE READ;

COMMIT
-- #endregion
