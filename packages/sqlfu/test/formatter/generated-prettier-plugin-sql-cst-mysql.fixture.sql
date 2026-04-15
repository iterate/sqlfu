-- default config: {"dialect":"mysql"}

-- #region: prettier-plugin-sql-cst / test / canonical_syntax.test: converts MySQL && and || operators to AND and OR
-- input:
SELECT a && b || c
-- output:
SELECT
  a && b || c
-- #endregion

-- #region: prettier-plugin-sql-cst / test / canonical_syntax.test: replaces DISTINCTROW with DISTINCT
-- input:
SELECT DISTINCTROW foo FROM tbl
-- output:
SELECT DISTINCTROW
  foo
FROM
  tbl
-- #endregion

-- #region: prettier-plugin-sql-cst / test / canonical_syntax.test: replaces INSERT with INSERT INTO
-- input:
INSERT foo (id) VALUES (1)
-- output:
INSERT
  foo (id)
VALUES
  (1)
-- #endregion

-- #region: prettier-plugin-sql-cst / test / canonical_syntax.test: replaces RENAME AS with RENAME TO
-- input:
ALTER TABLE foo RENAME AS bar
-- output:
ALTER TABLE foo
RENAME AS bar
-- #endregion

-- #region: prettier-plugin-sql-cst / test / canonical_syntax.test: replaces RENAME with RENAME TO
-- input:
ALTER TABLE foo RENAME bar
-- output:
ALTER TABLE foo
RENAME bar
-- #endregion

-- #region: prettier-plugin-sql-cst / test / canonical_syntax.test: replaces REPLACE with REPLACE INTO
-- input:
REPLACE foo (id) VALUES (1)
-- output:
REPLACE
  foo (id)
VALUES
  (1)
-- #endregion

-- #region: prettier-plugin-sql-cst / test / canonical_syntax.test: replaces TRUNCATE with TRUNCATE TABLE
-- input:
TRUNCATE client
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / alter_table.test: formats ALTER CONSTRAINT
-- input:
ALTER TABLE client
ALTER CHECK price_positive NOT ENFORCED
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / create_table.test: format MySQL column constraints
-- input:
CREATE TABLE client (
  id INT PRIMARY KEY AUTO_INCREMENT,
  fname VARCHAR(100) COMMENT 'First name',
  lname VARCHAR(100) KEY,
  age INT INVISIBLE,
  org_id INT COLUMN_FORMAT FIXED STORAGE DISK,
  content1 TEXT ENGINE_ATTRIBUTE '{ "indexing": "btree" }',
  content2 TEXT SECONDARY_ENGINE_ATTRIBUTE = '{ "indexing": "hashmap" }'
)
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / create_table.test: formats CREATE TABLE AS with column definitions
-- input:
CREATE TABLE foo (
  id INT,
  name VARCHAR(100)
) AS
  SELECT * FROM tbl WHERE x > 0
-- output:
CREATE TABLE foo (id INT, name VARCHAR(100)) AS
SELECT
  *
FROM
  tbl
WHERE
  x > 0
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / create_table.test: formats FOREIGN KEY with index name
-- input:
CREATE TABLE client (
  FOREIGN KEY indexName (org_id1) REFERENCES organization (id1)
)
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / create_table.test: formats MySQL table constraints
-- input:
CREATE TABLE client (
  id INT,
  name TEXT,
  KEY (id, name),
  FULLTEXT INDEX (name),
  CHECK (id > 0) NOT ENFORCED
)
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / create_table.test: formats MySQL table options
-- input:
CREATE TABLE foo (
  id INT
)
AUTOEXTEND_SIZE = 10,
AVG_ROW_LENGTH = 100,
DEFAULT CHARACTER SET latin1,
COMMENT = 'hello',
TABLESPACE ts1,
STORAGE DISK,
UNION = (foo, bar)
-- output:
CREATE TABLE foo (id INT) AUTOEXTEND_SIZE = 10,
AVG_ROW_LENGTH = 100,
DEFAULT CHARACTER SET latin1,
COMMENT = 'hello',
TABLESPACE ts1,
STORAGE DISK,
UNION
= (foo, bar)
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / rename_table.test: formats long list of renames
-- input:
RENAME TABLE
  my_schema.some_table TO my_schema.some_other_table,
  my_schema.some_table2 TO my_schema.some_other_table2
-- output:
RENAME TABLE my_schema.some_table TO my_schema.some_other_table,
my_schema.some_table2 TO my_schema.some_other_table2
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / rename_table.test: formats multi-table rename
-- input:
RENAME TABLE foo TO bar, zip TO zap
-- output:
RENAME TABLE foo TO bar,
zip TO zap
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / rename_table.test: formats RENAME TABLE statement
-- input:
RENAME TABLE foo TO bar
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / view.test: formats ALTER VIEW with columns
-- input:
ALTER VIEW my_view (foo, bar, baz)
AS
  SELECT 1, 2, 3
-- output:
ALTER VIEW my_view (foo, bar, baz) AS
SELECT
  1,
  2,
  3
-- #endregion

-- #region: prettier-plugin-sql-cst / test / ddl / view.test: formats DROP VIEW .. CASCADE|RESTRICT
-- input:
DROP VIEW my_view CASCADE
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dml / delete.test: formats DELETE with MySQL hints
-- input:
DELETE QUICK IGNORE FROM employee
WHERE id = 10
-- output:
DELETE QUICK IGNORE FROM employee
WHERE
  id = 10
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dml / insert.test: formats INSERT with MySQL hints
-- input:
INSERT LOW_PRIORITY IGNORE INTO employee
VALUES (1, 2, 3)
-- output:
INSERT LOW_PRIORITY IGNORE INTO
  employee
VALUES
  (1, 2, 3)
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dml / insert.test: formats INSERT with PARTITION selection
-- input:
INSERT INTO client PARTITION (p1, p2)
VALUES (1, 2, 3)
-- output:
INSERT INTO
  client PARTITION (p1, p2)
VALUES
  (1, 2, 3)
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dml / insert.test: formats multi-line (if user prefers)
-- input:
INSERT INTO client
VALUES (1, 2, 3)
ON DUPLICATE KEY UPDATE
  col1 = 2,
  col2 = DEFAULT
-- output:
INSERT INTO
  client
VALUES
  (1, 2, 3)
ON DUPLICATE KEY UPDATE
  col1 = 2,
  col2 = DEFAULT
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dml / insert.test: formats single-line (if user prefers)
-- input:
INSERT INTO client
VALUES (1, 2, 3)
ON DUPLICATE KEY UPDATE col1 = 2, col2 = DEFAULT
-- output:
INSERT INTO
  client
VALUES
  (1, 2, 3)
ON DUPLICATE KEY UPDATE
  col1 = 2,
  col2 = DEFAULT
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dml / insert.test: formats with row alias + column aliases on a single line
-- input:
INSERT INTO client
VALUES (1, 'John')
AS new_row (id, fname)
ON DUPLICATE KEY UPDATE id = new_row.id + 1
-- output:
INSERT INTO
  client
VALUES
  (1, 'John') AS new_row (id, fname)
ON DUPLICATE KEY UPDATE
  id = new_row.id + 1
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dml / insert.test: formats with row alias using column aliases
-- input:
INSERT INTO client
VALUES (1, 'John')
AS new_row
  (id, fname)
ON DUPLICATE KEY UPDATE
  id = new_row.id + 1
-- output:
INSERT INTO
  client
VALUES
  (1, 'John') AS new_row (id, fname)
ON DUPLICATE KEY UPDATE
  id = new_row.id + 1
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dml / insert.test: formats with simple row alias
-- input:
INSERT INTO client
VALUES (1, 'John')
AS new_row
ON DUPLICATE KEY UPDATE
  id = new_row.id + 1
-- output:
INSERT INTO
  client
VALUES
  (1, 'John') AS new_row
ON DUPLICATE KEY UPDATE
  id = new_row.id + 1
-- #endregion

-- #region: prettier-plugin-sql-cst / test / dml / update.test: formats MySQL hints
-- input:
UPDATE LOW_PRIORITY employee
SET salary = 1000
-- output:
UPDATE LOW_PRIORITY employee
SET
  salary = 1000
-- #endregion

-- #region: prettier-plugin-sql-cst / test / expr / expr.test: formats MATCH .. AGAINST expressions
-- input:
SELECT MATCH (title, body) AGAINST ('some text' IN NATURAL LANGUAGE MODE)
-- output:
SELECT
  MATCH(title, body) AGAINST ('some text' IN NATURAL LANGUAGE MODE)
-- #endregion

-- #region: prettier-plugin-sql-cst / test / expr / expr.test: formats MATCH .. AGAINST expressions
-- input:
SELECT MATCH (title, body) AGAINST ('some text')
-- output:
SELECT
  MATCH(title, body) AGAINST ('some text')
-- #endregion

-- #region: prettier-plugin-sql-cst / test / expr / expr.test: formats string concatenation with whitespace
-- input:
SELECT 'Hello' 'world'
-- output:
SELECT
  'Hello' 'world'
-- #endregion

-- #region: prettier-plugin-sql-cst / test / expr / expr.test: formats string literals with charset
-- input:
SELECT _utf8'Hello'
-- output:
SELECT
  _utf8 'Hello'
-- #endregion

-- #region: prettier-plugin-sql-cst / test / options / identifierCase.test: changes case of MySQL variables
-- input:
SELECT @foo, @Bar_, @foo_bar_123
-- output:
SELECT
  @foo,
  @Bar_,
  @foo_bar_123
-- #endregion

-- #region: prettier-plugin-sql-cst / test / options / identifierCase.test: does not change case of quoted MySQL variables
-- input:
SELECT @"foo", @'Bar_', @`foo_bar_123`
-- output:
SELECT
  @"foo",
  @'Bar_',
  @`foo_bar_123`
-- #endregion

-- #region: prettier-plugin-sql-cst / test / proc / prepared_statements.test: formats EXECUTE name USING ...args
-- input:
EXECUTE my_prepared_stmt USING 1, 'some text'
-- output:
EXECUTE my_prepared_stmt USING 1,
'some text'
-- #endregion

-- #region: prettier-plugin-sql-cst / test / proc / prepared_statements.test: formats EXECUTE name USING ...long argument list
-- input:
EXECUTE my_prepared_stmt USING
  1,
  'some text',
  3.14,
  TRUE,
  NULL,
  'another text',
  42,
  FALSE
-- output:
EXECUTE my_prepared_stmt USING 1,
'some text',
3.14,
TRUE,
NULL,
'another text',
42,
FALSE
-- #endregion

-- #region: prettier-plugin-sql-cst / test / proc / prepared_statements.test: formats PREPARE name FROM 'long string'
-- input:
PREPARE my_statement FROM
  'SELECT 1 AS col1, 2 AS col2, 3 AS col3, 4 AS col4, 5 AS col5'
-- output:
PREPARE my_statement
FROM
  'SELECT 1 AS col1, 2 AS col2, 3 AS col3, 4 AS col4, 5 AS col5'
-- #endregion

-- #region: prettier-plugin-sql-cst / test / proc / prepared_statements.test: formats PREPARE name FROM @var
-- input:
PREPARE my_statement FROM @var
-- output:
PREPARE my_statement
FROM
  @var
-- #endregion

-- #region: prettier-plugin-sql-cst / test / proc / return.test: formats RETURN statement with value
-- input:
RETURN 5 + 6
-- output: <unchanged>
-- #endregion

-- #region: prettier-plugin-sql-cst / test / select / from.test: formats FROM DUAL
-- input:
SELECT * FROM DUAL
-- output:
SELECT
  *
FROM
  DUAL
-- #endregion

-- #region: prettier-plugin-sql-cst / test / select / from.test: formats LATERAL subquery
-- input:
SELECT *
FROM
  tbl
  JOIN LATERAL (SELECT * FROM foo) AS t
-- output:
SELECT
  *
FROM
  tbl
  JOIN LATERAL (
    SELECT
      *
    FROM
      foo
  ) AS t
-- #endregion

-- #region: prettier-plugin-sql-cst / test / select / from.test: formats PARTITION selection
-- input:
SELECT * FROM tbl1 PARTITION (p1, p2)
-- output:
SELECT
  *
FROM
  tbl1 PARTITION (p1, p2)
-- #endregion

-- #region: prettier-plugin-sql-cst / test / select / into.test: formats INTO @variable
-- input:
SELECT 1, 2 INTO @var1, @var2
-- output:
SELECT
  1,
  2 INTO @var1,
  @var2
-- #endregion

-- #region: prettier-plugin-sql-cst / test / select / into.test: formats INTO DUMPFILE
-- input:
SELECT 1 INTO DUMPFILE 'file_name'
-- output:
SELECT
  1 INTO DUMPFILE 'file_name'
-- #endregion

-- #region: prettier-plugin-sql-cst / test / select / into.test: formats INTO OUTFILE
-- input:
SELECT 1 INTO OUTFILE 'file_name'
-- output:
SELECT
  1 INTO OUTFILE 'file_name'
-- #endregion

-- #region: prettier-plugin-sql-cst / test / select / into.test: formats INTO OUTFILE with options
-- input:
SELECT 1
INTO OUTFILE 'file_name'
  CHARACTER SET utf8
  FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"' ESCAPED BY '^'
  LINES STARTING BY '!' TERMINATED BY '\n'
-- output:
SELECT
  1 INTO OUTFILE 'file_name' CHARACTER SET utf8 FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"' ESCAPED BY '^' LINES STARTING BY '!' TERMINATED BY '\n'
-- #endregion

-- #region: prettier-plugin-sql-cst / test / select / into.test: formats long INTO @variable
-- config: {"expressionWidth":10}
-- input:
SELECT
  1,
  2
INTO
  @variable1,
  @variable2
-- output:
SELECT
  1,
  2 INTO @variable1,
  @variable2
-- #endregion

-- #region: prettier-plugin-sql-cst / test / select / select.test: formats GROUP BY .. WITH ROLLUP
-- config: {"expressionWidth":25}
-- input:
SELECT
  my_col
GROUP BY
  first_column,
  second_column
  WITH ROLLUP
-- output:
SELECT
  my_col
GROUP BY
  first_column,
  second_column
WITH
  ROLLUP
-- #endregion

-- #region: prettier-plugin-sql-cst / test / select / select.test: formats GROUP BY .. WITH ROLLUP
-- input:
SELECT * GROUP BY a, b WITH ROLLUP
-- output:
SELECT
  *
GROUP BY
  a,
  b
WITH
  ROLLUP
-- #endregion

-- #region: prettier-plugin-sql-cst / test / select / select.test: formats LOCK IN SHARE MODE
-- input:
SELECT * FROM tbl LOCK IN SHARE MODE
-- output:
SELECT
  *
FROM
  tbl LOCK IN SHARE MODE
-- #endregion

-- #region: prettier-plugin-sql-cst / test / select / select.test: formats MySQL hints
-- input:
SELECT HIGH_PRIORITY SQL_NO_CACHE col1, col2
FROM tbl
-- output:
SELECT
  HIGH_PRIORITY SQL_NO_CACHE col1,
  col2
FROM
  tbl
-- #endregion

-- #region: prettier-plugin-sql-cst / test / select / select.test: formats ORDER BY .. WITH ROLLUP
-- config: {"expressionWidth":25}
-- input:
SELECT
  my_col
ORDER BY
  first_column ASC,
  second_column DESC
  WITH ROLLUP
-- output:
SELECT
  my_col
ORDER BY
  first_column ASC,
  second_column DESC
WITH
  ROLLUP
-- #endregion

-- #region: prettier-plugin-sql-cst / test / select / select.test: formats ORDER BY .. WITH ROLLUP
-- input:
SELECT * ORDER BY a, b WITH ROLLUP
-- output:
SELECT
  *
ORDER BY
  a,
  b
WITH
  ROLLUP
-- #endregion
