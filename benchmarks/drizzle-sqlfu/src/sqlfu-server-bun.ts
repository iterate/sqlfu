// Adapted from drizzle-team/drizzle-benchmarks. This local copy keeps the benchmark shape comparable and adds sqlfu targets for side-by-side runs.
import cluster from 'cluster';
import 'dotenv/config';
import {Hono} from 'hono';
import os from 'os';
import cpuUsage from './cpu-usage';
import {createSqlfuBunClient} from './sqlfu/bun-client';
import {sqlfuQueries} from './sqlfu/queries';

const numCPUs = Number(process.env.BENCH_WORKERS || os.cpus().length);
const port = Number(process.env.SQLFU_BUN_PORT || 3004);

const sql = new Bun.SQL(process.env.DATABASE_URL!, {bigint: true, prepare: true});
const db = createSqlfuBunClient(sql);

const app = new Hono();
app.route('', cpuUsage);

app.get('/customers', async (c) => {
  const limit = Number(c.req.query('limit'));
  const offset = Number(c.req.query('offset'));
  const result = await sqlfuQueries.customers(db, {limit, offset});
  return c.json(result);
});

app.get('/customer-by-id', async (c) => {
  const result = await sqlfuQueries.customerById(db, Number(c.req.query('id')));
  return c.json(result);
});

app.get('/search-customer', async (c) => {
  const term = `${c.req.query('term')}:*`;
  const result = await sqlfuQueries.searchCustomer(db, term);
  return c.json(result);
});

app.get('/employees', async (c) => {
  const limit = Number(c.req.query('limit'));
  const offset = Number(c.req.query('offset'));
  const result = await sqlfuQueries.employees(db, {limit, offset});
  return c.json(result);
});

app.get('/employee-with-recipient', async (c) => {
  const result = await sqlfuQueries.employeeWithRecipient(db, Number(c.req.query('id')));
  return c.json(result);
});

app.get('/suppliers', async (c) => {
  const limit = Number(c.req.query('limit'));
  const offset = Number(c.req.query('offset'));
  const result = await sqlfuQueries.suppliers(db, {limit, offset});
  return c.json(result);
});

app.get('/supplier-by-id', async (c) => {
  const result = await sqlfuQueries.supplierById(db, Number(c.req.query('id')));
  return c.json(result);
});

app.get('/products', async (c) => {
  const limit = Number(c.req.query('limit'));
  const offset = Number(c.req.query('offset'));
  const result = await sqlfuQueries.products(db, {limit, offset});
  return c.json(result);
});

app.get('/product-with-supplier', async (c) => {
  const result = await sqlfuQueries.productWithSupplier(db, Number(c.req.query('id')));
  return c.json(result);
});

app.get('/search-product', async (c) => {
  const term = `${c.req.query('term')}:*`;
  const result = await sqlfuQueries.searchProduct(db, term);
  return c.json(result);
});

app.get('/orders-with-details', async (c) => {
  const limit = Number(c.req.query('limit'));
  const offset = Number(c.req.query('offset'));
  const result = await sqlfuQueries.ordersWithDetails(db, {limit, offset});
  return c.json(result);
});

app.get('/order-with-details', async (c) => {
  const result = await sqlfuQueries.orderWithDetails(db, Number(c.req.query('id')));
  return c.json(result);
});

app.get('/order-with-details-and-products', async (c) => {
  const result = await sqlfuQueries.orderWithDetailsAndProducts(db, Number(c.req.query('id')));
  return c.json(result);
});

if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} is running`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker) => {
    console.log(`worker ${worker.process.pid} died`);
  });
} else {
  Bun.serve({
    fetch: app.fetch,
    port,
  });
  console.log(`Worker ${process.pid} started on ${port}`);
}
