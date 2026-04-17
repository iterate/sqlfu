import http from 'node:http';

const port = Number(process.argv[2]);

if (!Number.isInteger(port) || port <= 0) {
  throw new Error(`Invalid port: ${process.argv[2]}`);
}

const server = http.createServer((_, response) => {
  response.writeHead(200, {'content-type': 'text/plain'});
  response.end('ok');
});

server.listen(port);

const stop = () => {
  server.close(() => {
    process.exit(0);
  });
};

process.once('SIGTERM', stop);
process.once('SIGINT', stop);
