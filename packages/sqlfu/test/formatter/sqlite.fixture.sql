-- default config: {"dialect":"sqlite","keywordCase":"lower"}

-- #region: simple create table
-- input:
create table foo (       a int);
-- output:
create table foo (a int);
-- #endregion

-- #region: unchanged already-formatted select
-- input:
select
  foo,
  bar
from
  baz;
-- output: <unchanged>
-- #endregion
