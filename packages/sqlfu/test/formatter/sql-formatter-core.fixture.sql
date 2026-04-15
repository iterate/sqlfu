-- default config: {"dialect":"sqlite"}

-- #region: select with asterisks
-- input:
SELECT tbl.*, count(*), col1 * col2 FROM tbl;
-- output:
SELECT
  tbl.*,
  count(*),
  col1 * col2
FROM
  tbl;
-- #endregion

-- #region: complex select
-- input:
SELECT DISTINCT name, ROUND(age/7) field1, 18 + 20 AS field2, 'some string' FROM foo;
-- output:
SELECT DISTINCT
  name,
  ROUND(age / 7) field1,
  18 + 20 AS field2,
  'some string'
FROM
  foo;
-- #endregion

-- #region: complex where
-- input:
SELECT * FROM foo WHERE Column1 = 'testing'
AND ( (Column2 = Column3 OR Column4 >= ABS(5)) );
-- output:
SELECT
  *
FROM
  foo
WHERE
  Column1 = 'testing'
  AND (
    (
      Column2 = Column3
      OR Column4 >= ABS(5)
    )
  );
-- #endregion

-- #region: top-level reserved words
-- input:
SELECT * FROM foo WHERE name = 'John' GROUP BY some_column
HAVING column > 10 ORDER BY other_column;
-- output:
SELECT
  *
FROM
  foo
WHERE
  name = 'John'
GROUP BY
  some_column
HAVING
  column > 10
ORDER BY
  other_column;
-- #endregion

-- #region: keywords as column names in qualified references
-- input:
SELECT mytable.update, mytable.select FROM mytable WHERE mytable.from > 10;
-- output:
SELECT
  mytable.update,
  mytable.select
FROM
  mytable
WHERE
  mytable.from > 10;
-- #endregion

-- #region: order by
-- input:
SELECT * FROM foo ORDER BY col1 ASC, col2 DESC;
-- output:
SELECT
  *
FROM
  foo
ORDER BY
  col1 ASC,
  col2 DESC;
-- #endregion

-- #region: subquery in from clause
-- input:
SELECT *, SUM(*) AS total FROM (SELECT * FROM Posts WHERE age > 10) WHERE a > b
-- output:
SELECT
  *,
  SUM(*) AS total
FROM
  (
    SELECT
      *
    FROM
      Posts
    WHERE
      age > 10
  )
WHERE
  a > b
-- #endregion

-- #region: open paren after comma in values list
-- input:
INSERT INTO TestIds (id) VALUES (4),(5), (6),(7),(9),(10),(11);
-- output:
INSERT INTO
  TestIds (id)
VALUES
  (4),
  (5),
  (6),
  (7),
  (9),
  (10),
  (11);
-- #endregion

-- #region: short nested parenthesized expression
-- input:
SELECT (a + b * (c - SIN(1)));
-- output:
SELECT
  (a + b * (c - SIN(1)));
-- #endregion

-- #region: multi-word reserved words with inconsistent spacing
-- input:
SELECT * FROM foo LEFT 	   
 JOIN mycol ORDER 
 BY blah
-- output:
SELECT
  *
FROM
  foo
  LEFT JOIN mycol
ORDER BY
  blah
-- #endregion

-- #region: long double parenthesized query
-- input:
((foo = '0123456789-0123456789-0123456789-0123456789'))
-- output:
(
  (
    foo = '0123456789-0123456789-0123456789-0123456789'
  )
)
-- #endregion

-- #region: short double parenthesized query
-- input:
((foo = 'bar'))
-- output: <unchanged>
-- #endregion

-- #region: unicode letters in identifiers
-- input:
SELECT 结合使用, тест FROM töörõõm;
-- output:
SELECT
  结合使用,
  тест
FROM
  töörõõm;
-- #endregion

-- #region: unicode numbers in identifiers
-- input:
SELECT my၁၂၃ FROM tbl༡༢༣;
-- output:
SELECT
  my၁၂၃
FROM
  tbl༡༢༣;
-- #endregion

-- #region: join keyword uppercasing
-- config: {"keywordCase":"upper"}
-- input:
select * from customers join foo on foo.id = customers.id;
-- output:
SELECT
  *
FROM
  customers
  JOIN foo ON foo.id = customers.id;
-- #endregion

-- #region: join using uppercasing
-- config: {"keywordCase":"upper"}
-- input:
select * from customers join foo using (id);
-- output:
SELECT
  *
FROM
  customers
  JOIN foo USING (id);
-- #endregion

-- #region: plain join
-- input:
SELECT * FROM customers
JOIN orders ON customers.customer_id = orders.customer_id
JOIN items ON items.id = orders.id;
-- output:
SELECT
  *
FROM
  customers
  JOIN orders ON customers.customer_id = orders.customer_id
  JOIN items ON items.id = orders.id;
-- #endregion

-- #region: inner join
-- input:
SELECT * FROM customers
INNER JOIN orders ON customers.customer_id = orders.customer_id
INNER JOIN items ON items.id = orders.id;
-- output:
SELECT
  *
FROM
  customers
  INNER JOIN orders ON customers.customer_id = orders.customer_id
  INNER JOIN items ON items.id = orders.id;
-- #endregion

-- #region: left join
-- input:
SELECT * FROM customers
LEFT JOIN orders ON customers.customer_id = orders.customer_id
LEFT JOIN items ON items.id = orders.id;
-- output:
SELECT
  *
FROM
  customers
  LEFT JOIN orders ON customers.customer_id = orders.customer_id
  LEFT JOIN items ON items.id = orders.id;
-- #endregion

-- #region: right join
-- input:
SELECT * FROM customers
RIGHT JOIN orders ON customers.customer_id = orders.customer_id
RIGHT JOIN items ON items.id = orders.id;
-- output:
SELECT
  *
FROM
  customers
  RIGHT JOIN orders ON customers.customer_id = orders.customer_id
  RIGHT JOIN items ON items.id = orders.id;
-- #endregion

-- #region: full join
-- input:
SELECT * FROM customers
FULL JOIN orders ON customers.customer_id = orders.customer_id
FULL JOIN items ON items.id = orders.id;
-- output:
SELECT
  *
FROM
  customers
  FULL JOIN orders ON customers.customer_id = orders.customer_id
  FULL JOIN items ON items.id = orders.id;
-- #endregion

-- #region: natural left outer join
-- input:
SELECT * FROM customers
NATURAL LEFT OUTER JOIN orders ON customers.customer_id = orders.customer_id
NATURAL LEFT OUTER JOIN items ON items.id = orders.id;
-- output:
SELECT
  *
FROM
  customers
  NATURAL LEFT OUTER JOIN orders ON customers.customer_id = orders.customer_id
  NATURAL LEFT OUTER JOIN items ON items.id = orders.id;
-- #endregion

-- #region: simple insert into
-- input:
INSERT INTO Customers (ID, MoneyBalance, Address, City) VALUES (12,-123.4, 'Skagen 2111','Stv');
-- output:
INSERT INTO
  Customers (ID, MoneyBalance, Address, City)
VALUES
  (12, -123.4, 'Skagen 2111', 'Stv');
-- #endregion

-- #region: simple update
-- input:
UPDATE Customers SET ContactName='Alfred Schmidt', City='Hamburg' WHERE CustomerName='Alfreds Futterkiste';
-- output:
UPDATE Customers
SET
  ContactName = 'Alfred Schmidt',
  City = 'Hamburg'
WHERE
  CustomerName = 'Alfreds Futterkiste';
-- #endregion

-- #region: update from subquery
-- input:
UPDATE customers SET total_orders = order_summary.total  FROM ( SELECT * FROM bank) AS order_summary
-- output:
UPDATE customers
SET
  total_orders = order_summary.total
FROM
  (
    SELECT
      *
    FROM
      bank
  ) AS order_summary
-- #endregion

-- #region: multiple ctes
-- input:
WITH
cte_1 AS (
  SELECT a FROM b WHERE c = 1
),
cte_2 AS (
  SELECT c FROM d WHERE e = 2
),
final AS (
  SELECT * FROM cte_1 LEFT JOIN cte_2 ON b = d
)
SELECT * FROM final;
-- output:
WITH
  cte_1 AS (
    SELECT
      a
    FROM
      b
    WHERE
      c = 1
  ),
  cte_2 AS (
    SELECT
      c
    FROM
      d
    WHERE
      e = 2
  ),
  final AS (
    SELECT
      *
    FROM
      cte_1
      LEFT JOIN cte_2 ON b = d
  )
SELECT
  *
FROM
  final;
-- #endregion
