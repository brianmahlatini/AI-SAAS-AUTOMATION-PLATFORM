# AI SaaS Automation Platform

AI SaaS Automation Platform is a full-stack automation product where users can build workflows that connect external events, APIs, AI, Slack, Gmail, and business logic without writing code for every task. It is designed like a focused Zapier-style workflow builder, but with first-class AI nodes powered by OpenAI.

The platform lets a user drag workflow nodes onto a canvas, connect them in the order they should run, configure each step, then execute the workflow manually or through a webhook endpoint. When the workflow runs, the backend queues the job, processes every node in order, records logs, stores outputs, tracks AI token usage, and streams live execution progress back to the dashboard.

This repository contains both the customer-facing SaaS application and the backend execution system: authentication, role-based admin access, subscription billing, workflow storage, execution history, queue processing, realtime updates, rate limiting, caching, and integration executors.

## What This Really Does

Most teams have repetitive work spread across many tools: a form submission arrives, a support ticket needs summarizing, a lead needs enrichment, a Slack message should be sent, or an email needs to be generated from incoming data. This app gives users one place to turn those repetitive steps into reusable workflows.

A normal user can sign in, open the dashboard, create a workflow, drag nodes into a visual flow, save it, run it, and inspect every execution. An admin can view platform totals such as users, workflows, executions, subscriptions, and usage events. Stripe handles subscription upgrades, while Clerk handles user identity and roles.

At runtime, the workflow engine receives an input payload, starts from the trigger node, executes connected nodes one by one, stores each node output, and makes those outputs available to later nodes through template variables. For example, an AI node can summarize a webhook payload, and a Gmail or Slack node can send that AI summary to a real person.

## Example Automations You Can Build

- **Webhook to AI email summary**: receive a webhook payload, summarize it with OpenAI, then send the summary through Gmail.
- **Lead intake workflow**: receive a website form submission, call an external CRM API, use AI to classify the lead, then notify the sales team in Slack.
- **Support triage workflow**: receive a support request, ask AI to determine priority, branch with a condition node, then send urgent issues to Slack.
- **API monitoring workflow**: call an API endpoint, check the response status with a condition node, and alert a team when the result fails.
- **Content workflow**: send raw text into a webhook, use AI to rewrite or summarize it, then email the final result.
- **Delayed follow-up workflow**: receive a trigger, wait using a delay node, then send a follow-up message or call another API.

## How A Workflow Runs

1. A user creates or edits a workflow in the visual builder.
2. The workflow is stored in MongoDB as nodes, edges, positions, and node configuration.
3. The workflow can be started manually from the UI or externally through its generated webhook URL.
4. The Express API creates an execution record and pushes a job into BullMQ.
5. The worker loads the workflow definition, starts at the trigger/root node, and executes each connected node.
6. Every node writes a log entry with status, timing, input metadata, output, or error details.
7. OpenAI usage is recorded as billing usage events in PostgreSQL.
8. Socket.IO sends realtime execution updates to any browser watching that execution.
9. Completed execution output is saved so the user can review what happened later.

## Product Areas

- **Dashboard**: shows workflow counts, active workflows, recent executions, and AI token usage.
- **Workflow Builder**: visual drag-and-drop editor for connecting automation nodes.
- **Execution Detail**: live timeline showing queued, running, completed, skipped, and failed node events.
- **Billing**: displays the current plan, token usage, subscription options, Stripe Checkout, and Stripe portal access.
- **Admin**: shows platform-wide usage and operational totals for admin users.
- **Authentication**: Clerk-powered sign-in with role metadata for normal users and admins.
- **Workflow Engine**: background worker that executes automation steps safely outside the request cycle.

## Product Screenshots

### Dashboard

![Dashboard](docs/assets/screenshots/dashboard.png)

### Login

![Login](docs/assets/screenshots/login.png)

### Workflow Builder

![Workflow Builder](docs/assets/screenshots/workflow-builder.png)

### Billing

![Billing](docs/assets/screenshots/billing.png)

### Admin

![Admin](docs/assets/screenshots/admin.png)

## What This Platform Does

- Gives users a visual builder for creating automations from connected nodes instead of hard-coded scripts.
- Accepts external events through generated webhook URLs, so other apps can trigger workflows.
- Runs workflows manually from the UI for testing, demos, and one-off automation runs.
- Executes AI prompts through OpenAI and stores the generated text for later workflow steps.
- Lets later nodes reuse earlier outputs with template variables such as `{{trigger.body.email}}` or `{{steps.ai-summary.text}}`.
- Sends Slack messages from workflow data through a bot token or webhook URL.
- Sends Gmail messages when a valid Google OAuth access token is provided to the Gmail node.
- Calls external APIs with configurable HTTP method, URL, headers, and body.
- Supports condition nodes for simple branching decisions.
- Supports delay nodes for wait steps inside a workflow.
- Runs long-running automation jobs asynchronously through BullMQ instead of blocking HTTP requests.
- Stores workflow definitions and execution logs in MongoDB.
- Stores users, subscriptions, and token usage events in PostgreSQL.
- Uses Redis for queueing, workflow definition caching, and API rate limiting.
- Streams execution progress to the frontend with Socket.IO so users can watch the run happen live.
- Includes Clerk authentication with `USER` and `ADMIN` roles.
- Includes Stripe Checkout, Customer Portal sessions, subscription webhook handling, and plan tracking.
- Includes S3 presigned upload support for future file-based automation steps.

## Tech Stack

### Frontend

- Next.js App Router
- React 19
- React Flow
- Clerk for authentication UI/session handling
- Socket.IO client for realtime execution updates
- Tailwind CSS and lucide-react icons

### Backend

- Node.js, Express, TypeScript
- Socket.IO realtime service
- BullMQ workflow queue and worker
- MongoDB with Mongoose
- PostgreSQL with `pg`
- Redis with `ioredis`
- Clerk backend auth
- Stripe billing
- OpenAI API
- Google APIs for Gmail
- AWS SDK for S3 uploads

### Infrastructure

- Docker Compose for local development
- MongoDB, PostgreSQL, and Redis containers
- Backend API container
- Worker container
- Frontend container
- AWS-ready S3 integration

## Project Structure

```text
AI SAAS AUTOMATION PLATFORM/
|-- backend/
|   |-- src/
|   |   |-- config/              # Environment, Redis, logger
|   |   |-- database/            # MongoDB and PostgreSQL connections
|   |   |-- engine/              # Workflow runner, templating, conditions
|   |   |   `-- executors/       # Node executors: AI, API, Slack, Gmail, delay, condition
|   |   |-- middleware/          # Auth, rate limiting, error handling
|   |   |-- modules/
|   |   |   |-- admin/           # Admin overview API
|   |   |   |-- billing/         # Stripe checkout, portal, webhooks, usage
|   |   |   |-- executions/      # Execution models and API
|   |   |   |-- files/           # S3 presigned upload API
|   |   |   |-- integrations/    # Integration helper routes
|   |   |   |-- users/           # User repository
|   |   |   `-- workflows/       # Workflow CRUD, validation, webhook trigger
|   |   |-- queues/              # BullMQ queue producer
|   |   |-- realtime/            # Socket.IO setup and events
|   |   |-- app.ts               # Express app composition
|   |   |-- server.ts            # API entry point
|   |   `-- worker.ts            # Background worker entry point
|   |-- sql/schema.sql           # PostgreSQL schema
|   `-- Dockerfile
|-- frontend/
|   |-- src/
|   |   |-- app/
|   |   |   |-- admin/           # Admin dashboard
|   |   |   |-- billing/         # Billing plans and portal
|   |   |   |-- dashboard/       # Workflow and execution overview
|   |   |   |-- executions/      # Execution detail page
|   |   |   `-- workflows/       # New/edit workflow pages
|   |   |-- components/          # Shared shell, cards, badges, timelines
|   |   |   `-- workflow/        # Builder, node cards, config panel, catalog
|   |   `-- lib/                 # API client, formatters, shared types
|   |-- public/
|   `-- Dockerfile
|-- docs/
|   |-- API.md                   # REST and realtime endpoint overview
|   |-- ARCHITECTURE.md          # System architecture notes
|   |-- ENVIRONMENT.md           # Required environment keys
|   `-- assets/screenshots/      # README screenshots
|-- scripts/                     # Utility scripts
|-- docker-compose.yml           # Local full-stack runtime
|-- package.json                 # Workspace scripts
`-- .env.example                 # Safe environment template
```

## Core Workflow Nodes

- `Webhook`: starts a workflow from an external HTTP event. Incoming request body, query, and headers become available as `trigger` data.
- `API Request`: calls external APIs with configurable method, URL, headers, and body. Fields can include values from the trigger or previous steps.
- `AI`: sends a prompt to OpenAI, returns generated text, stores response metadata, and records token usage for billing analytics.
- `Delay`: pauses execution for a configured number of milliseconds before continuing to the next node.
- `Condition`: compares two values and chooses a true or false branch when connected with condition handles.
- `Slack`: sends a message to a Slack channel using either a Slack webhook URL or the configured Slack bot token plus channel.
- `Gmail`: sends an email using Google OAuth. The node needs `to`, `subject`, `body`, and a valid Gmail OAuth access token.

## Workflow Templates And Data Passing

Node fields support Handlebars-style templates. That is how one step can use data from another step.

The original trigger payload is available as:

```text
{{trigger.body}}
{{trigger.query}}
{{trigger.headers}}
```

Specific trigger fields can be used like this:

```text
{{trigger.body.email}}
{{trigger.body.name}}
{{trigger.body.message}}
```

Outputs from completed nodes are stored under `steps` by node id:

```text
{{steps.ai-summary.text}}
{{steps.apiRequest-1234567890.status}}
{{steps.webhook.body}}
```

To render a full object as JSON inside a prompt or message, use:

```text
{{json trigger.body}}
```

Example AI prompt:

```text
Summarize this customer request in three bullet points:

{{json trigger.body}}
```

Example Gmail body using an AI result:

```text
New request summary:

{{steps.ai-summary.text}}
```

## Example Workflow: AI Email Summary

This is the easiest automation to understand:

```text
Webhook trigger -> AI summary -> Gmail
```

When the workflow receives data, the AI node summarizes the incoming payload, then the Gmail node sends that summary to an email address.

Example incoming webhook body:

```json
{
  "name": "Sarah",
  "email": "sarah@example.com",
  "message": "I need help choosing the right enterprise plan for my team."
}
```

Example AI node prompt:

```text
Write a short internal email summary for this lead:

{{json trigger.body}}
```

Example Gmail node body:

```text
New lead received.

AI summary:
{{steps.ai-summary.text}}

Customer email:
{{trigger.body.email}}
```

## Current Integration Notes

- OpenAI is fully wired through the backend AI executor and requires `OPENAI_API_KEY`.
- Slack can send messages when `SLACK_BOT_TOKEN` is configured and the node has a channel, or when the node has a webhook URL.
- Gmail sending is implemented, but the current UI expects a Google OAuth access token to be pasted into the Gmail node. A production SaaS version should add a proper "Connect Gmail" OAuth flow and store connected account tokens securely.
- Stripe billing is implemented for checkout, subscription updates, billing portal access, and webhook handling.
- Clerk is the only authentication provider used by this project.

## Local Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Environment File

Copy the template and fill in your own keys:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Keep `.env` private. It is ignored by Git and should never be committed.

### 3. Start With Docker

```bash
npm run docker:up
```

Docker runs:

- Frontend: `http://localhost:3001`
- Backend API: `http://localhost:4000`
- MongoDB: `localhost:27018`
- PostgreSQL: `localhost:5433`
- Redis: `localhost:6380`

### 4. Run Without Docker

Start MongoDB, PostgreSQL, and Redis yourself, then run:

```bash
npm run dev
npm run worker
```

In direct local mode, the frontend normally runs on `http://localhost:3000`.

## Environment Variables

The full list is documented in [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md). The main groups are:

- App URLs: `BACKEND_PORT`, `FRONTEND_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`
- Databases: `MONGO_URI`, `POSTGRES_URL`, `REDIS_URL`
- Auth: `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- AI: `OPENAI_API_KEY`, `OPENAI_MODEL`
- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_ENTERPRISE`
- Integrations: `SLACK_BOT_TOKEN`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- AWS: `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET`

## Auth And Roles

The app uses Clerk only. User roles are read from Clerk public metadata:

```json
{
  "role": "ADMIN"
}
```

Users without the `ADMIN` role are treated as normal users. Admin-only API routes and the admin dashboard require the `ADMIN` role.

## Billing

Stripe is wired for:

- Free plan display
- Pro checkout session
- Enterprise checkout session
- Customer portal session
- Subscription create/update/delete webhook handling
- AI token usage events

For local webhook testing:

```bash
stripe listen --forward-to localhost:4000/api/billing/webhook --events checkout.session.completed,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted
```

Put the returned `whsec_...` value into `STRIPE_WEBHOOK_SECRET`.

## API Overview

See [docs/API.md](docs/API.md) for the endpoint list.

Main API groups:

- `/api/workflows`
- `/api/webhooks`
- `/api/executions`
- `/api/billing`
- `/api/files`
- `/api/admin`

Realtime clients subscribe to execution updates through Socket.IO using `execution:subscribe`.

## Quality Checks

```bash
npm run typecheck
npm run lint
npm run build
```

## Production Notes

- Store secrets in AWS Secrets Manager, SSM Parameter Store, or your deployment provider secret store.
- Use managed MongoDB, PostgreSQL, and Redis for production.
- Run the API and worker as separate services so execution load does not block HTTP traffic.
- Put the backend behind TLS and configure `FRONTEND_URL` for CORS.
- Configure Stripe live products and live webhook secrets before going live.
- Use least-privilege IAM permissions for S3 instead of broad AWS access.
- Rotate API keys before production if they were ever pasted into chat, screenshots, or logs.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Environment Keys](docs/ENVIRONMENT.md)
- [API Overview](docs/API.md)
