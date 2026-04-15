-- default config: {"dialect":"sqlite"}

-- #region: multiline select clauses
-- input:
SELECT *
FROM tbl
WHERE x > y
GROUP BY foo, bar
HAVING foo > bar
ORDER BY foo, bar DESC
LIMIT 100, 25
-- output:
SELECT
  *
FROM
  tbl
WHERE
  x > y
GROUP BY
  foo,
  bar
HAVING
  foo > bar
ORDER BY
  foo,
  bar DESC
LIMIT
  100, 25
-- #endregion

-- #region: multiline columns
-- input:
SELECT
  col1,
  col2,
  col3
-- output: <unchanged>
-- #endregion

-- #region: select star
-- input:
SELECT *
-- output:
SELECT
  *
-- #endregion

-- #region: select distinct
-- input:
SELECT DISTINCT
  col1,
  col2,
  col3
FROM tbl
-- output:
SELECT DISTINCT
  col1,
  col2,
  col3
FROM
  tbl
-- #endregion

-- #region: set operations
-- input:
SELECT * FROM client WHERE status = 'inactive'
UNION ALL
SELECT * FROM disabled_client
INTERSECT
SELECT * FROM faulty_client
-- output:
SELECT
  *
FROM
  client
WHERE
  status = 'inactive'
UNION ALL
SELECT
  *
FROM
  disabled_client
INTERSECT
SELECT
  *
FROM
  faulty_client
-- #endregion

-- #region: line comments block
-- input:
-- first line comment
-- second line comment
SELECT 1; -- third line comment
-- final comment
-- output:
-- first line comment
-- second line comment
SELECT
  1;

-- third line comment
-- final comment
-- #endregion

-- #region: block comments between syntax elements
-- input:
CREATE /*c1*/ TABLE /*c2*/ IF /*c3*/ NOT EXISTS /*c4*/ foo (
  id /*c5*/ INT /*c6*/ NOT /*c7*/ NULL
);
-- output:
CREATE /*c1*/ TABLE /*c2*/ IF /*c3*/ NOT EXISTS /*c4*/ foo (id /*c5*/ INT /*c6*/ NOT /*c7*/ NULL);
-- #endregion

-- #region: leading and trailing block comments around select
-- input:
/* leading comment */
SELECT 1, /*com1*/ 2 /*com2*/;
/* trailing comment */
-- output:
/* leading comment */
SELECT
  1,
  /*com1*/ 2 /*com2*/;

/* trailing comment */
-- #endregion

-- #region: short with clause inside multiline select
-- input:
WITH cte1 AS (SELECT * FROM client)
SELECT *
FROM cte1
-- output:
WITH
  cte1 AS (
    SELECT
      *
    FROM
      client
  )
SELECT
  *
FROM
  cte1
-- #endregion

-- #region: long with clause
-- input:
WITH
  cte1 AS (SELECT * FROM client WHERE age > 100),
  cte2 AS (SELECT * FROM client WHERE age < 10)
SELECT *
FROM cte1
-- output:
WITH
  cte1 AS (
    SELECT
      *
    FROM
      client
    WHERE
      age > 100
  ),
  cte2 AS (
    SELECT
      *
    FROM
      client
    WHERE
      age < 10
  )
SELECT
  *
FROM
  cte1
-- #endregion
