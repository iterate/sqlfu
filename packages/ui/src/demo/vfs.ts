import northwindDefinitions from './northwind/definitions.sql?raw';

export type VirtualFile = {
  name: string;
  content: string;
};

export type DemoVfsSnapshot = {
  definitions: string;
  migrations: VirtualFile[];
  queries: VirtualFile[];
};

const INITIAL_DEFINITIONS = northwindDefinitions;

const INITIAL_QUERIES: VirtualFile[] = [
  {
    name: 'top-customers-by-revenue.sql',
    content: `select customers.customer_id,
       customers.company_name,
       customers.country,
       round(sum(order_details.unit_price * order_details.quantity * (1 - order_details.discount)), 2) as revenue
from customers
  join orders on orders.customer_id = customers.customer_id
  join order_details on order_details.order_id = orders.order_id
group by customers.customer_id
order by revenue desc
limit 10;
`,
  },
  {
    name: 'product-sales-by-category.sql',
    content: `select categories.category_name,
       count(distinct order_details.order_id) as orders,
       sum(order_details.quantity) as units_sold,
       round(sum(order_details.unit_price * order_details.quantity * (1 - order_details.discount)), 2) as revenue
from categories
  join products on products.category_id = categories.category_id
  join order_details on order_details.product_id = products.product_id
group by categories.category_id
order by revenue desc;
`,
  },
  {
    name: 'employees-leaderboard.sql',
    content: `select employees.employee_id,
       employees.first_name || ' ' || employees.last_name as name,
       employees.title,
       count(distinct orders.order_id) as orders,
       round(sum(order_details.unit_price * order_details.quantity * (1 - order_details.discount)), 2) as revenue
from employees
  left join orders on orders.employee_id = employees.employee_id
  left join order_details on order_details.order_id = orders.order_id
group by employees.employee_id
order by revenue desc nulls last;
`,
  },
  {
    name: 'orders-needing-attention.sql',
    content: `select orders.order_id,
       orders.order_date,
       orders.required_date,
       customers.company_name,
       customers.country
from orders
  join customers on customers.customer_id = orders.customer_id
where orders.shipped_date is null
  and orders.required_date is not null
order by orders.required_date asc
limit 25;
`,
  },
];

export class DemoVfs {
  definitions: string = INITIAL_DEFINITIONS;
  migrations: VirtualFile[] = [];
  queries: VirtualFile[] = INITIAL_QUERIES.map((query) => ({...query}));

  snapshot(): DemoVfsSnapshot {
    return {
      definitions: this.definitions,
      migrations: this.migrations.map((file) => ({...file})),
      queries: this.queries.map((file) => ({...file})),
    };
  }

  writeDefinitions(sql: string) {
    this.definitions = sql.trimEnd() + '\n';
  }

  writeMigration(file: VirtualFile) {
    const existing = this.migrations.findIndex((migration) => migration.name === file.name);
    if (existing === -1) {
      this.migrations.push({...file});
      this.migrations.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      this.migrations[existing] = {...file};
    }
  }

  writeQuery(file: VirtualFile) {
    const existing = this.queries.findIndex((query) => query.name === file.name);
    if (existing === -1) {
      this.queries.push({...file});
      this.queries.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      this.queries[existing] = {...file};
    }
  }

  renameQuery(oldName: string, newName: string) {
    const existing = this.queries.find((query) => query.name === oldName);
    if (!existing) {
      throw new Error(`Query ${oldName} not found`);
    }
    existing.name = newName;
    this.queries.sort((a, b) => a.name.localeCompare(b.name));
  }

  deleteQuery(name: string) {
    const index = this.queries.findIndex((query) => query.name === name);
    if (index !== -1) {
      this.queries.splice(index, 1);
    }
  }

  findQuery(id: string): VirtualFile | undefined {
    return this.queries.find((query) => query.name === `${id}.sql`);
  }
}
