-- default config: {"dialect":"sqlite"}

-- #region: pragma read
-- input:
PRAGMA function_list
-- output: <unchanged>
-- #endregion

-- #region: pragma assignment
-- input:
PRAGMA encoding = 'UTF-8'
-- output: <unchanged>
-- #endregion

-- #region: pragma function call
-- input:
PRAGMA my_schema.wal_checkpoint(PASSIVE)
-- output:
PRAGMA my_schema.wal_checkpoint (PASSIVE)
-- #endregion

-- #region: attach database
-- input:
ATTACH DATABASE 'my_file.sqlite' AS my_schema
-- output: <unchanged>
-- #endregion

-- #region: attach without database keyword
-- input:
ATTACH 'my_file.sqlite' AS my_schema
-- output: <unchanged>
-- #endregion

-- #region: detach database
-- input:
DETACH DATABASE my_schema
-- output: <unchanged>
-- #endregion

-- #region: detach without database keyword
-- input:
DETACH my_schema
-- output: <unchanged>
-- #endregion

-- #region: vacuum schema into file
-- input:
VACUUM my_schema INTO 'my_file.sqlite'
-- output: <unchanged>
-- #endregion

-- #region: vacuum plain
-- input:
VACUUM
-- output: <unchanged>
-- #endregion

-- #region: vacuum schema only
-- input:
VACUUM my_schema
-- output: <unchanged>
-- #endregion

-- #region: vacuum into file
-- input:
VACUUM INTO 'my_file.sqlite'
-- output: <unchanged>
-- #endregion

-- #region: tiny with clause from prettier suite
-- input:
WITH cte1 AS (SELECT * FROM client) SELECT * FROM cte1
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

-- #region: short select from prettier suite
-- input:
SELECT a, b, c FROM tbl WHERE x > y
-- output:
SELECT
  a,
  b,
  c
FROM
  tbl
WHERE
  x > y
-- #endregion
