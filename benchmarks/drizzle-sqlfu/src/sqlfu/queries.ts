// Adapted from drizzle-team/drizzle-benchmarks. This local copy keeps the benchmark shape comparable and adds a sqlfu target for side-by-side runs.
import type {AsyncClient, QueryArg, ResultRow, SqlQuery} from '../../../../packages/sqlfu/src/types';

type LimitOffset = {
  limit: number;
  offset: number;
};

type SqlfuPgClient = AsyncClient;

export const sqlfuQueries = {
  customers(client: SqlfuPgClient, params: LimitOffset) {
    return client.all(query('sqlfu_customers', customersSql, [params.limit, params.offset]));
  },
  async customerById(client: SqlfuPgClient, id: number) {
    return first(await client.all(query('sqlfu_customer_by_id', customerByIdSql, [id])));
  },
  searchCustomer(client: SqlfuPgClient, term: string) {
    return client.all(query('sqlfu_search_customer', searchCustomerSql, [term]));
  },
  employees(client: SqlfuPgClient, params: LimitOffset) {
    return client.all(query('sqlfu_employees', employeesSql, [params.limit, params.offset]));
  },
  async employeeWithRecipient(client: SqlfuPgClient, id: number) {
    return first(await client.all(query('sqlfu_employee_with_recipient', employeeWithRecipientSql, [id])));
  },
  suppliers(client: SqlfuPgClient, params: LimitOffset) {
    return client.all(query('sqlfu_suppliers', suppliersSql, [params.limit, params.offset]));
  },
  async supplierById(client: SqlfuPgClient, id: number) {
    return first(await client.all(query('sqlfu_supplier_by_id', supplierByIdSql, [id])));
  },
  products(client: SqlfuPgClient, params: LimitOffset) {
    return client.all(query('sqlfu_products', productsSql, [params.limit, params.offset]));
  },
  async productWithSupplier(client: SqlfuPgClient, id: number) {
    return first(await client.all(query('sqlfu_product_with_supplier', productWithSupplierSql, [id])));
  },
  searchProduct(client: SqlfuPgClient, term: string) {
    return client.all(query('sqlfu_search_product', searchProductSql, [term]));
  },
  ordersWithDetails(client: SqlfuPgClient, params: LimitOffset) {
    return client.all(query('sqlfu_orders_with_details', ordersWithDetailsSql, [params.limit, params.offset]));
  },
  async orderWithDetails(client: SqlfuPgClient, id: number) {
    return first(await client.all(query('sqlfu_order_with_details', orderWithDetailsSql, [id])));
  },
  async orderWithDetailsAndProducts(client: SqlfuPgClient, id: number) {
    return first(await client.all(query('sqlfu_order_with_details_and_products', orderWithDetailsAndProductsSql, [id])));
  },
};

function query(name: string, sql: string, args: QueryArg[]): SqlQuery {
  return {sql, args, name};
}

function first<TRow extends ResultRow>(rows: TRow[]): TRow | null {
  return rows[0] || null;
}

const customersSql = `
select
  "d0"."id" as "id",
  "d0"."company_name" as "companyName",
  "d0"."contact_name" as "contactName",
  "d0"."contact_title" as "contactTitle",
  "d0"."address" as "address",
  "d0"."city" as "city",
  "d0"."postal_code" as "postalCode",
  "d0"."region" as "region",
  "d0"."country" as "country",
  "d0"."phone" as "phone",
  "d0"."fax" as "fax"
from "customers" as "d0"
order by "d0"."id" asc
limit $1
offset $2
`;

const customerByIdSql = `
select
  "d0"."id" as "id",
  "d0"."company_name" as "companyName",
  "d0"."contact_name" as "contactName",
  "d0"."contact_title" as "contactTitle",
  "d0"."address" as "address",
  "d0"."city" as "city",
  "d0"."postal_code" as "postalCode",
  "d0"."region" as "region",
  "d0"."country" as "country",
  "d0"."phone" as "phone",
  "d0"."fax" as "fax"
from "customers" as "d0"
where "d0"."id" = $1
`;

const searchCustomerSql = `
select
  "d0"."id" as "id",
  "d0"."company_name" as "companyName",
  "d0"."contact_name" as "contactName",
  "d0"."contact_title" as "contactTitle",
  "d0"."address" as "address",
  "d0"."city" as "city",
  "d0"."postal_code" as "postalCode",
  "d0"."region" as "region",
  "d0"."country" as "country",
  "d0"."phone" as "phone",
  "d0"."fax" as "fax"
from "customers" as "d0"
where to_tsvector('english', "d0"."company_name") @@ to_tsquery('english', $1)
`;

const employeesSql = `
select
  "d0"."id" as "id",
  "d0"."last_name" as "lastName",
  "d0"."first_name" as "firstName",
  "d0"."title" as "title",
  "d0"."title_of_courtesy" as "titleOfCourtesy",
  "d0"."birth_date" as "birthDate",
  "d0"."hire_date" as "hireDate",
  "d0"."address" as "address",
  "d0"."city" as "city",
  "d0"."postal_code" as "postalCode",
  "d0"."country" as "country",
  "d0"."home_phone" as "homePhone",
  "d0"."extension" as "extension",
  "d0"."notes" as "notes",
  "d0"."recipient_id" as "recipientId"
from "employees" as "d0"
order by "d0"."id" asc
limit $1
offset $2
`;

const employeeWithRecipientSql = `
select
  "d0"."id" as "id",
  "d0"."last_name" as "lastName",
  "d0"."first_name" as "firstName",
  "d0"."title" as "title",
  "d0"."title_of_courtesy" as "titleOfCourtesy",
  "d0"."birth_date" as "birthDate",
  "d0"."hire_date" as "hireDate",
  "d0"."address" as "address",
  "d0"."city" as "city",
  "d0"."postal_code" as "postalCode",
  "d0"."country" as "country",
  "d0"."home_phone" as "homePhone",
  "d0"."extension" as "extension",
  "d0"."notes" as "notes",
  "d0"."recipient_id" as "recipientId",
  "recipient"."r" as "recipient"
from "employees" as "d0"
left join lateral (
  select row_to_json("t".*) "r"
  from (
    select
      "d1"."id" as "id",
      "d1"."last_name" as "lastName",
      "d1"."first_name" as "firstName",
      "d1"."title" as "title",
      "d1"."title_of_courtesy" as "titleOfCourtesy",
      "d1"."birth_date" as "birthDate",
      "d1"."hire_date" as "hireDate",
      "d1"."address" as "address",
      "d1"."city" as "city",
      "d1"."postal_code" as "postalCode",
      "d1"."country" as "country",
      "d1"."home_phone" as "homePhone",
      "d1"."extension" as "extension",
      "d1"."notes" as "notes",
      "d1"."recipient_id" as "recipientId"
    from "employees" as "d1"
    where "d0"."recipient_id" = "d1"."id"
  ) as "t"
) as "recipient" on true
where "d0"."id" = $1
`;

const suppliersSql = `
select
  "d0"."id" as "id",
  "d0"."company_name" as "companyName",
  "d0"."contact_name" as "contactName",
  "d0"."contact_title" as "contactTitle",
  "d0"."address" as "address",
  "d0"."city" as "city",
  "d0"."region" as "region",
  "d0"."postal_code" as "postalCode",
  "d0"."country" as "country",
  "d0"."phone" as "phone"
from "suppliers" as "d0"
order by "d0"."id" asc
limit $1
offset $2
`;

const supplierByIdSql = `
select
  "d0"."id" as "id",
  "d0"."company_name" as "companyName",
  "d0"."contact_name" as "contactName",
  "d0"."contact_title" as "contactTitle",
  "d0"."address" as "address",
  "d0"."city" as "city",
  "d0"."region" as "region",
  "d0"."postal_code" as "postalCode",
  "d0"."country" as "country",
  "d0"."phone" as "phone"
from "suppliers" as "d0"
where "d0"."id" = $1
`;

const productsSql = `
select
  "d0"."id" as "id",
  "d0"."name" as "name",
  "d0"."qt_per_unit" as "quantityPerUnit",
  "d0"."unit_price" as "unitPrice",
  "d0"."units_in_stock" as "unitsInStock",
  "d0"."units_on_order" as "unitsOnOrder",
  "d0"."reorder_level" as "reorderLevel",
  "d0"."discontinued" as "discontinued",
  "d0"."supplier_id" as "supplierId"
from "products" as "d0"
order by "d0"."id" asc
limit $1
offset $2
`;

const productWithSupplierSql = `
select
  "d0"."id" as "id",
  "d0"."name" as "name",
  "d0"."qt_per_unit" as "quantityPerUnit",
  "d0"."unit_price" as "unitPrice",
  "d0"."units_in_stock" as "unitsInStock",
  "d0"."units_on_order" as "unitsOnOrder",
  "d0"."reorder_level" as "reorderLevel",
  "d0"."discontinued" as "discontinued",
  "d0"."supplier_id" as "supplierId",
  "supplier"."r" as "supplier"
from "products" as "d0"
left join lateral (
  select row_to_json("t".*) "r"
  from (
    select
      "d1"."id" as "id",
      "d1"."company_name" as "companyName",
      "d1"."contact_name" as "contactName",
      "d1"."contact_title" as "contactTitle",
      "d1"."address" as "address",
      "d1"."city" as "city",
      "d1"."region" as "region",
      "d1"."postal_code" as "postalCode",
      "d1"."country" as "country",
      "d1"."phone" as "phone"
    from "suppliers" as "d1"
    where "d0"."supplier_id" = "d1"."id"
  ) as "t"
) as "supplier" on true
where "d0"."id" = $1
`;

const searchProductSql = `
select
  "d0"."id" as "id",
  "d0"."name" as "name",
  "d0"."qt_per_unit" as "quantityPerUnit",
  "d0"."unit_price" as "unitPrice",
  "d0"."units_in_stock" as "unitsInStock",
  "d0"."units_on_order" as "unitsOnOrder",
  "d0"."reorder_level" as "reorderLevel",
  "d0"."discontinued" as "discontinued",
  "d0"."supplier_id" as "supplierId"
from "products" as "d0"
where to_tsvector('english', "d0"."name") @@ to_tsquery('english', $1)
`;

const ordersWithDetailsSql = `
select
  "orders"."id" as "id",
  "orders"."shipped_date" as "shippedDate",
  "orders"."ship_name" as "shipName",
  "orders"."ship_city" as "shipCity",
  "orders"."ship_country" as "shipCountry",
  count("order_details"."product_id")::int as "productsCount",
  sum("order_details"."quantity")::int as "quantitySum",
  sum("order_details"."quantity" * "order_details"."unit_price")::real as "totalPrice"
from "orders"
left join "order_details" on "order_details"."order_id" = "orders"."id"
group by "orders"."id"
order by "orders"."id" asc
limit $1
offset $2
`;

const orderWithDetailsSql = `
select
  "orders"."id" as "id",
  "orders"."shipped_date" as "shippedDate",
  "orders"."ship_name" as "shipName",
  "orders"."ship_city" as "shipCity",
  "orders"."ship_country" as "shipCountry",
  count("order_details"."product_id")::int as "productsCount",
  sum("order_details"."quantity")::int as "quantitySum",
  sum("order_details"."quantity" * "order_details"."unit_price")::real as "totalPrice"
from "orders"
left join "order_details" on "order_details"."order_id" = "orders"."id"
where "orders"."id" = $1
group by "orders"."id"
order by "orders"."id" asc
`;

const orderWithDetailsAndProductsSql = `
select
  "d0"."id" as "id",
  "d0"."order_date" as "orderDate",
  "d0"."required_date" as "requiredDate",
  "d0"."shipped_date" as "shippedDate",
  "d0"."ship_via" as "shipVia",
  "d0"."freight" as "freight",
  "d0"."ship_name" as "shipName",
  "d0"."ship_city" as "shipCity",
  "d0"."ship_region" as "shipRegion",
  "d0"."ship_postal_code" as "shipPostalCode",
  "d0"."ship_country" as "shipCountry",
  "d0"."customer_id" as "customerId",
  "d0"."employee_id" as "employeeId",
  "details"."r" as "details"
from "orders" as "d0"
left join lateral (
  select coalesce(json_agg(row_to_json("t".*)), '[]') as "r"
  from (
    select
      "d1"."unit_price" as "unitPrice",
      "d1"."quantity" as "quantity",
      "d1"."discount" as "discount",
      "d1"."order_id" as "orderId",
      "d1"."product_id" as "productId",
      "product"."r" as "product"
    from "order_details" as "d1"
    left join lateral (
      select row_to_json("t".*) "r"
      from (
        select
          "d2"."id" as "id",
          "d2"."name" as "name",
          "d2"."qt_per_unit" as "quantityPerUnit",
          "d2"."unit_price" as "unitPrice",
          "d2"."units_in_stock" as "unitsInStock",
          "d2"."units_on_order" as "unitsOnOrder",
          "d2"."reorder_level" as "reorderLevel",
          "d2"."discontinued" as "discontinued",
          "d2"."supplier_id" as "supplierId"
        from "products" as "d2"
        where "d1"."product_id" = "d2"."id"
      ) as "t"
    ) as "product" on true
    where "d0"."id" = "d1"."order_id"
  ) as "t"
) as "details" on true
where "d0"."id" = $1
`;
