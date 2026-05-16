---
status: in-progress
size: large
branch: ui-relations
---

# UI relation click-through

## Status Summary

Worktree created on `ui-relations`; implementation not started yet. The task is now specified around foreign-key metadata in the studio schema response, forward cell click-through from child rows to parent rows, and reverse relation discovery from parent rows back to child lists.

## Goal

Make foreign-key relationships navigable inside the sqlfu UI, similar to Drizzle Studio:

- In a child table cell such as `order_details.product_id`, show an affordance when that column has a foreign key to `products.product_id`.
- Activating it opens an inline sub-view of the referenced parent row, effectively `select * from products where product_id = :cellValue`.
- In a parent-table key cell such as `products.product_id`, show reverse relation actions such as `order_details via product_id`.
- Activating a reverse action opens an inline sub-view of matching child rows, effectively `select * from order_details where product_id = :cellValue`.

## Assumptions

- Start with single-column foreign keys. Composite keys can be represented in the metadata shape, but the first UI pass only exposes actions when both sides have one column.
- Use the existing relation table/query surface as much as possible. Relation popovers should feel like filtered table sub-views, not a separate SQL runner.
- Forward links are shown for non-null child values. Null foreign-key cells do not get a clickable action.
- Reverse links are shown on referenced columns, with a menu if more than one child relation points at the same parent column.
- The demo Northwind schema is enough for visible Playwright coverage because it already has `order_details.product_id -> products.product_id` and `orders.customer_id -> customers.customer_id`.
- The first pass can be SQLite/dialect-generic through the sqlfu dialect contract, but it must not hard-code Northwind table names outside tests.

## Checklist

- [ ] Extend the studio schema response with relation metadata. _Not started._
- [ ] Add a focused server/API test proving `schema.get` exposes forward and reverse foreign-key facts. _Not started._
- [ ] Add a Playwright spec for forward navigation from `order_details.product_id` to the referenced `products` row. _Not started._
- [ ] Add a Playwright spec for reverse navigation from a `products.product_id` cell to matching `order_details` rows. _Not started._
- [ ] Implement row-cell affordances and relation sub-view popovers in the table UI. _Not started._
- [ ] Keep relation sub-view SQL visible or inspectable enough that the interaction teaches the underlying query. _Not started._
- [ ] Run focused server, UI, and type checks before moving the task to complete. _Not started._

## TDD Plan

1. Red: `schema.get` returns foreign-key metadata for a tiny fixture schema.
2. Green: add dialect-level relation metadata and route it through `StudioRelation`.
3. Red: Playwright forward-link test in the Northwind demo.
4. Green: render child-cell relation affordance and parent-row sub-view.
5. Red: Playwright reverse-link test in the Northwind demo.
6. Green: render referenced-column reverse relation menu and child-list sub-view.
7. Refactor: extract relation metadata helpers if the UI wiring gets noisy.

## Implementation Notes

- 2026-05-16: Worktreeified on branch `ui-relations` from updated `main`.
