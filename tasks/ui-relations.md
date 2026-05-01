❯ my relations thoughts:

  - we should see if we can support them similarly to drizzle studio. basically if order_details has an order_id column which is a foreign key references orders(id), then there should be a little icon that appears
  in ther order_id cell on hover/select, to open a popover table which is basically `select * from orders where id = ${cellValue}`. ideally that popover shows a view which is basically the same as the table
  viewer, with a filter applied. similarly there could be an three-dots button on the "id" cells for the "orders" table. clicking it shows the inferred relations - i.e. there'd be another button for
  `order_details.order_id`, and clicking that shows a similar sub-view popover which renders `select * from order_details where order_id = ${cellValue}` (which might have multiple rows of course)

  this is trickier and more broad than the other stuff i've given you so worktreeify it