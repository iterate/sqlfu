create table categories (
  category_id integer primary key autoincrement,
  category_name text,
  description text,
  picture blob
);

create table customer_customer_demo (
  customer_id text not null,
  customer_type_id text not null,
  primary key (customer_id, customer_type_id),
  foreign key (customer_id) references customers (customer_id) on delete no action on update no action,
  foreign key (customer_type_id) references customer_demographics (customer_type_id) on delete no action on update no action
);

create table customer_demographics (
  customer_type_id text not null,
  customer_desc text,
  primary key (customer_type_id)
);

create table customers (
  customer_id text,
  company_name text,
  contact_name text,
  contact_title text,
  address text,
  city text,
  region text,
  postal_code text,
  country text,
  phone text,
  fax text,
  primary key (customer_id)
);

create table employees (
  employee_id integer primary key autoincrement,
  last_name text,
  first_name text,
  title text,
  title_of_courtesy text,
  birth_date date,
  hire_date date,
  address text,
  city text,
  region text,
  postal_code text,
  country text,
  home_phone text,
  extension text,
  photo blob,
  notes text,
  reports_to integer,
  photo_path text,
  foreign key (reports_to) references employees (employee_id) on delete no action on update no action
);

create table employee_territories (
  employee_id integer not null,
  territory_id text not null,
  primary key (employee_id, territory_id),
  foreign key (employee_id) references employees (employee_id) on delete no action on update no action,
  foreign key (territory_id) references territories (territory_id) on delete no action on update no action
);

create table order_details (
  order_id integer not null,
  product_id integer not null,
  unit_price numeric not null default 0,
  quantity integer not null default 1,
  discount real not null default 0,
  primary key (order_id, product_id),
  check (
    discount >= (0)
    and discount <= (1)
  ),
  check (quantity > (0)),
  check (unit_price >= (0)),
  foreign key (order_id) references orders (order_id) on delete no action on update no action,
  foreign key (product_id) references products (product_id) on delete no action on update no action
);

create table orders (
  order_id integer not null primary key autoincrement,
  customer_id text,
  employee_id integer,
  order_date datetime,
  required_date datetime,
  shipped_date datetime,
  ship_via integer,
  freight numeric default 0,
  ship_name text,
  ship_address text,
  ship_city text,
  ship_region text,
  ship_postal_code text,
  ship_country text,
  foreign key (employee_id) references employees (employee_id) on delete no action on update no action,
  foreign key (customer_id) references customers (customer_id) on delete no action on update no action,
  foreign key (ship_via) references shippers (shipper_id) on delete no action on update no action
);

create table products (
  product_id integer not null primary key autoincrement,
  product_name text not null,
  supplier_id integer,
  category_id integer,
  quantity_per_unit text,
  unit_price numeric default 0,
  units_in_stock integer default 0,
  units_on_order integer default 0,
  reorder_level integer default 0,
  discontinued text not null default '0',
  check (unit_price >= (0)),
  check (reorder_level >= (0)),
  check (units_in_stock >= (0)),
  check (units_on_order >= (0)),
  foreign key (category_id) references categories (category_id) on delete no action on update no action,
  foreign key (supplier_id) references suppliers (supplier_id) on delete no action on update no action
);

create table regions (
  region_id integer not null primary key,
  region_description text not null
);

create table shippers (
  shipper_id integer not null primary key autoincrement,
  company_name text not null,
  phone text
);

create table suppliers (
  supplier_id integer not null primary key autoincrement,
  company_name text not null,
  contact_name text,
  contact_title text,
  address text,
  city text,
  region text,
  postal_code text,
  country text,
  phone text,
  fax text,
  home_page text
);

create table territories (
  territory_id text not null,
  territory_description text not null,
  region_id integer not null,
  primary key (territory_id),
  foreign key (region_id) references regions (region_id) on delete no action on update no action
);

create view alphabetical_list_of_products as
select products.*, categories.category_name
from
  categories
  inner join products on categories.category_id = products.category_id
where (((products.discontinued) = 0));

create view current_product_list as
select product_id, product_name
from products
where discontinued = 0;

create view customer_and_suppliers_by_city as
select city, company_name, contact_name, 'Customers' as relationship
from customers
union
select city, company_name, contact_name, 'Suppliers'
from suppliers
order by city, company_name;

create view invoices as
select
  orders.ship_name,
  orders.ship_address,
  orders.ship_city,
  orders.ship_region,
  orders.ship_postal_code,
  orders.ship_country,
  orders.customer_id,
  customers.company_name as customer_name,
  customers.address,
  customers.city,
  customers.region,
  customers.postal_code,
  customers.country,
  (employees.first_name + ' ' + employees.last_name) as salesperson,
  orders.order_id,
  orders.order_date,
  orders.required_date,
  orders.shipped_date,
  shippers.company_name as shipper_name,
  order_details.product_id,
  products.product_name,
  order_details.unit_price,
  order_details.quantity,
  order_details.discount,
  (
    (
      (
        order_details.unit_price * quantity * (1 - discount)
      ) / 100
    ) * 100
  ) as extended_price,
  orders.freight
from
  customers
  join orders on customers.customer_id = orders.customer_id
  join employees on employees.employee_id = orders.employee_id
  join order_details on orders.order_id = order_details.order_id
  join products on products.product_id = order_details.product_id
  join shippers on shippers.shipper_id = orders.ship_via;

create view orders_qry as
select
  orders.order_id,
  orders.customer_id,
  orders.employee_id,
  orders.order_date,
  orders.required_date,
  orders.shipped_date,
  orders.ship_via,
  orders.freight,
  orders.ship_name,
  orders.ship_address,
  orders.ship_city,
  orders.ship_region,
  orders.ship_postal_code,
  orders.ship_country,
  customers.company_name,
  customers.address,
  customers.city,
  customers.region,
  customers.postal_code,
  customers.country
from customers join orders on customers.customer_id = orders.customer_id;

create view order_subtotals as
select
  order_details.order_id,
  sum(
    (
      order_details.unit_price * quantity * (1 - discount) / 100
    ) * 100
  ) as subtotal
from order_details
group by order_details.order_id;

create view product_sales_for_1997 as
select
  categories.category_name,
  products.product_name,
  sum(
    (
      order_details.unit_price * quantity * (1 - discount) / 100
    ) * 100
  ) as product_sales
from
  categories
  join products on categories.category_id = products.category_id
  join order_details on products.product_id = order_details.product_id
  join orders on orders.order_id = order_details.order_id
where
  orders.shipped_date between datetime('1997-01-01') and datetime('1997-12-31')
group by categories.category_name, products.product_name;

create view products_above_average_price as
select products.product_name, products.unit_price
from products
where
  products.unit_price > (
    select
      avg(unit_price)
    from
      products
  );

create view products_by_category as
select
  categories.category_name,
  products.product_name,
  products.quantity_per_unit,
  products.units_in_stock,
  products.discontinued
from
  categories
  inner join products on categories.category_id = products.category_id
where products.discontinued <> 1;

create view quarterly_orders as
select distinct
  customers.customer_id,
  customers.company_name,
  customers.city,
  customers.country
from customers join orders on customers.customer_id = orders.customer_id
where
  orders.order_date between datetime('1997-01-01') and datetime('1997-12-31');

create view sales_totals_by_amount as
select
  order_subtotals.subtotal as sale_amount,
  orders.order_id,
  customers.company_name,
  orders.shipped_date
from
  customers
  join orders on customers.customer_id = orders.customer_id
  join order_subtotals on orders.order_id = order_subtotals.order_id
where
  (order_subtotals.subtotal > 2500)
  and (
    orders.shipped_date between datetime('1997-01-01') and datetime('1997-12-31')
  );

create view summary_of_sales_by_quarter as
select orders.shipped_date, orders.order_id, order_subtotals.subtotal
from
  orders
  inner join order_subtotals on orders.order_id = order_subtotals.order_id
where orders.shipped_date is not null;

create view summary_of_sales_by_year as
select orders.shipped_date, orders.order_id, order_subtotals.subtotal
from
  orders
  inner join order_subtotals on orders.order_id = order_subtotals.order_id
where orders.shipped_date is not null;

create view category_sales_for_1997 as
select
  product_sales_for_1997.category_name,
  sum(product_sales_for_1997.product_sales) as category_sales
from product_sales_for_1997
group by product_sales_for_1997.category_name;

create view order_details_extended as
select
  order_details.order_id,
  order_details.product_id,
  products.product_name,
  order_details.unit_price,
  order_details.quantity,
  order_details.discount,
  (
    order_details.unit_price * quantity * (1 - discount) / 100
  ) * 100 as extended_price
from
  products
  join order_details on products.product_id = order_details.product_id;

create view sales_by_category as
select
  categories.category_id,
  categories.category_name,
  products.product_name,
  sum(order_details_extended.extended_price) as product_sales
from
  categories
  join products on categories.category_id = products.category_id
  join order_details_extended on products.product_id = order_details_extended.product_id
  join orders on orders.order_id = order_details_extended.order_id
where
  orders.order_date between datetime('1997-01-01') and datetime('1997-12-31')
group by
  categories.category_id,
  categories.category_name,
  products.product_name;
