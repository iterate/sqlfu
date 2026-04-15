-- default config: {"dialect":"mariadb"}

-- #region: prettier-plugin-sql-cst / test / canonical_syntax.test: converts MariaDB && and || operators to AND and OR
-- input:
SELECT a && b || c
-- output:
SELECT
  a && b || c
-- #endregion

-- #region: prettier-plugin-sql-cst / test / select / limiting.test: formats LIMIT ... ROWS EXAMINED
-- config: {"expressionWidth":20}
-- input:
SELECT *
FROM tbl
LIMIT
  25, 100
  ROWS EXAMINED 1000
-- output:
SELECT
  *
FROM
  tbl
LIMIT
  25, 100 ROWS EXAMINED 1000
-- #endregion
