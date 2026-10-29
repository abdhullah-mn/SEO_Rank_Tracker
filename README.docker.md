# Docker

## Production-like local stack

1. Copy `.env.example` to `.env` and set a unique `JWT_SECRET` and your `SERP_API_KEY`.
2. Start the stack:

```bash
docker compose up --build -d
```

The frontend is available at `http://localhost:8080` and the backend health endpoint at `http://localhost:5000/healthz`. The browser uses the frontend's same-origin `/api` proxy, while the server reaches MongoDB at the Compose service name `mongo`.

To use MongoDB Atlas instead of the local container, set `MONGODB_URI` in `.env`. The local MongoDB volume is named `mongo_data` and is retained by `docker compose down`.

## Useful commands

```bash
docker compose ps
docker compose logs -f client server mongo
docker compose down
docker compose down -v
docker compose build --no-cache
```

There are no application migration scripts. Mongoose creates collections and indexes as the application uses them.

## Development

Run the existing Vite and Node commands directly for development. The production Compose setup intentionally serves the compiled Vite output through Nginx.