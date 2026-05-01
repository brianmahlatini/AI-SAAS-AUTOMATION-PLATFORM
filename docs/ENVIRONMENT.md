# Environment Keys

Fill these after the code is generated.

## Required For Local Core

- `MONGO_URI`
- `POSTGRES_URL`
- `REDIS_URL`
- `BACKEND_PORT`
- `FRONTEND_URL`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_WS_URL`

## Authentication

Use Clerk only.

- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`

## AI

- `OPENAI_API_KEY`
- `OPENAI_MODEL`

## Stripe

- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_PRO`
- `STRIPE_PRICE_ENTERPRISE`

## Integrations

- `SLACK_BOT_TOKEN`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

Gmail send nodes expect a user OAuth `accessToken` in the node data or a future connected-account store.

## AWS S3

- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `S3_BUCKET`

Use an IAM user or role with scoped permissions for the bucket only.
