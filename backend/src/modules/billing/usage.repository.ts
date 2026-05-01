import { pgPool } from "../../database/postgres";

export type UsageEventInput = {
  ownerId: string;
  executionId?: string;
  nodeId?: string;
  provider: string;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
};

export async function recordUsageEvent(input: UsageEventInput): Promise<void> {
  await pgPool.query(
    `
      INSERT INTO usage_events (
        owner_id,
        execution_id,
        node_id,
        provider,
        model,
        input_tokens,
        output_tokens
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
    [
      input.ownerId,
      input.executionId ?? null,
      input.nodeId ?? null,
      input.provider,
      input.model ?? null,
      input.inputTokens ?? 0,
      input.outputTokens ?? 0
    ]
  );
}

export async function getUsageSummary(ownerId: string): Promise<{
  inputTokens: number;
  outputTokens: number;
  events: number;
}> {
  const result = await pgPool.query(
    `
      SELECT
        COALESCE(SUM(input_tokens), 0)::int AS input_tokens,
        COALESCE(SUM(output_tokens), 0)::int AS output_tokens,
        COUNT(*)::int AS events
      FROM usage_events
      WHERE owner_id = $1
        AND created_at >= date_trunc('month', NOW())
    `,
    [ownerId]
  );

  const row = result.rows[0];
  return {
    inputTokens: row?.input_tokens ?? 0,
    outputTokens: row?.output_tokens ?? 0,
    events: row?.events ?? 0
  };
}

export async function countUsageEvents(): Promise<number> {
  const result = await pgPool.query("SELECT COUNT(*)::int AS count FROM usage_events");
  return result.rows[0]?.count ?? 0;
}
