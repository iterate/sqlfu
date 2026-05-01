// Adapted from drizzle-team/drizzle-benchmarks. This local copy keeps the benchmark shape comparable and adds a sqlfu target for side-by-side runs.
import * as d from "drizzle-orm/pg-core";
import type { InferInsertModel } from "drizzle-orm";

export const customers = d.snakeCase.table("customers", {
  id: d.serial().primaryKey(),
  companyName: d.text().notNull(),
  contactName: d.varchar().notNull(),
  contactTitle: d.varchar().notNull(),
  address: d.varchar().notNull(),
  city: d.varchar().notNull(),
  postalCode: d.varchar(),
  region: d.varchar(),
  country: d.varchar().notNull(),
  phone: d.varchar().notNull(),
  fax: d.varchar(),
});

export const employees = d.snakeCase.table(
  "employees",
  {
    id: d.serial().primaryKey(),
    lastName: d.varchar().notNull(),
    firstName: d.varchar(),
    title: d.varchar().notNull(),
    titleOfCourtesy: d.varchar().notNull(),
    birthDate: d.date({ mode: "date" }).notNull(),
    hireDate: d.date({ mode: "date" }).notNull(),
    address: d.varchar().notNull(),
    city: d.varchar().notNull(),
    postalCode: d.varchar().notNull(),
    country: d.varchar().notNull(),
    homePhone: d.varchar().notNull(),
    extension: d.integer().notNull(),
    notes: d.text().notNull(),
    recipientId: d.integer(),
  },
  (table) => [
    d.foreignKey({
      columns: [table.recipientId],
      foreignColumns: [table.id],
    }),
    d.index("recepient_idx").on(table.recipientId),
  ],
);

export const orders = d.snakeCase.table("orders", {
  id: d.serial().primaryKey(),
  orderDate: d.date({ mode: "date" }).notNull(),
  requiredDate: d.date({ mode: "date" }).notNull(),
  shippedDate: d.date({ mode: "date" }),
  shipVia: d.integer().notNull(),
  freight: d.doublePrecision().notNull(),
  shipName: d.varchar().notNull(),
  shipCity: d.varchar().notNull(),
  shipRegion: d.varchar(),
  shipPostalCode: d.varchar(),
  shipCountry: d.varchar().notNull(),
  customerId: d
    .integer()
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  employeeId: d
    .integer()
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
});

export const suppliers = d.snakeCase.table("suppliers", {
  id: d.serial().primaryKey(),
  companyName: d.varchar().notNull(),
  contactName: d.varchar().notNull(),
  contactTitle: d.varchar().notNull(),
  address: d.varchar().notNull(),
  city: d.varchar().notNull(),
  region: d.varchar(),
  postalCode: d.varchar().notNull(),
  country: d.varchar().notNull(),
  phone: d.varchar().notNull(),
});

export const products = d.snakeCase.table(
  "products",
  {
    id: d.serial().primaryKey(),
    name: d.text().notNull(),
    quantityPerUnit: d.varchar().notNull(),
    unitPrice: d.doublePrecision().notNull(),
    unitsInStock: d.integer().notNull(),
    unitsOnOrder: d.integer().notNull(),
    reorderLevel: d.integer().notNull(),
    discontinued: d.integer().notNull(),
    supplierId: d
      .serial()
      .notNull()
      .references(() => suppliers.id, { onDelete: "cascade" }),
  },
  (table) => [d.index("supplier_idx").on(table.supplierId)],
);

export const details = d.snakeCase.table(
  "order_details",
  {
    unitPrice: d.doublePrecision().notNull(),
    quantity: d.integer().notNull(),
    discount: d.doublePrecision().notNull(),
    orderId: d
      .integer()
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: d
      .integer()
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
  },
  (t) => [
    d.index("order_id_idx").on(t.orderId),
    d.index("product_id_idx").on(t.productId),
  ],
);

export type CustomerInsert = InferInsertModel<typeof customers>;
export type DetailInsert = InferInsertModel<typeof details>;
export type OrderInsert = InferInsertModel<typeof orders>;
export type ProductInsert = InferInsertModel<typeof products>;
export type SupplierInsert = InferInsertModel<typeof suppliers>;
