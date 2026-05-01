# API Overview

Base URL: `http://localhost:4000`

## Workflows

- `GET /api/workflows`
- `POST /api/workflows`
- `GET /api/workflows/:id`
- `PUT /api/workflows/:id`
- `DELETE /api/workflows/:id`
- `POST /api/workflows/:id/execute`

## Public Webhooks

- `POST /api/webhooks/:webhookKey`

## Executions

- `GET /api/executions`
- `GET /api/executions/:id`

## Billing

- `GET /api/billing/subscription`
- `POST /api/billing/checkout`
- `POST /api/billing/portal`
- `POST /api/billing/webhook`

## Files

- `POST /api/files/presign-upload`

## Admin

- `GET /api/admin/overview`

## Realtime

Socket.IO namespace: `/`

Events:

- Client emits `execution:subscribe` with an execution id.
- Server emits `execution:update` with status, logs, and node updates.

