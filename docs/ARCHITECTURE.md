# Architecture

## High Level

The repository is split into two deployable applications.

- `frontend`: Next.js dashboard and workflow builder.
- `backend`: Express REST API, Socket.IO realtime service, BullMQ queue producer, workflow worker, integrations, billing, and database access.

## Data Stores

- MongoDB stores workflow documents and execution logs because the node graph and node outputs are document-shaped.
- PostgreSQL stores users, subscriptions, and usage events because billing and account records need relational integrity.
- Redis powers rate limiting, workflow definition caching, and BullMQ queues.

## Workflow Execution

1. A workflow run is requested through `POST /api/workflows/:id/execute` or a public webhook trigger.
2. The API creates a queued execution record and pushes a BullMQ job.
3. The worker loads the workflow, walks the graph, executes each node, stores logs, and emits progress events.
4. Connected browsers subscribed to `execution:{id}` receive live progress over Socket.IO.

## Node Types

- `webhook`: passes trigger payload into the workflow.
- `apiRequest`: performs templated HTTP requests.
- `ai`: executes prompts through OpenAI.
- `delay`: pauses execution for a configured number of milliseconds.
- `condition`: evaluates a safe comparison and follows true or false edges.
- `slack`: sends Slack messages using bot token or webhook URL.
- `gmail`: sends Gmail messages using a user OAuth access token.

## Production Deployment

- Backend and worker can run as separate EC2 services or containers.
- Frontend can run on EC2, ECS, or a Next-compatible hosting provider.
- Use managed MongoDB, PostgreSQL, and Redis in production.
- Store secrets in AWS Secrets Manager or SSM Parameter Store.
- Put the backend behind a load balancer with TLS and sticky-free Socket.IO transport.
