import { config } from "../../config/env";
import { AppError } from "../../middleware/error";
import { renderTemplate } from "../template";
import type { NodeExecutor } from "../types";

export const executeSlackNode: NodeExecutor = async (node, context) => {
  const data = renderTemplate(node.data ?? {}, {
    trigger: context.trigger,
    steps: context.steps
  }) as Record<string, unknown>;

  const text = String(data.text ?? "");
  if (!text) {
    throw new AppError(400, "Slack node requires message text", "NODE_CONFIG_INVALID");
  }

  if (data.webhookUrl) {
    const response = await fetch(String(data.webhookUrl), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text })
    });

    return {
      output: {
        provider: "slack",
        mode: "webhook",
        ok: response.ok,
        status: response.status,
        body: await response.text()
      }
    };
  }

  const token = String(data.botToken ?? config.integrations.slackBotToken ?? "").trim();
  const channel = String(data.channel ?? "").trim();

  if (!token) {
    throw new AppError(400, "Slack node requires SLACK_BOT_TOKEN or a node bot token", "NODE_CONFIG_INVALID");
  }

  if (!channel) {
    throw new AppError(400, "Slack node requires a channel, for example #new-channel or a Slack channel ID", "NODE_CONFIG_INVALID");
  }

  const response = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      channel,
      text
    })
  });
  const body = await response.json();

  if (!response.ok || !body.ok) {
    throw new AppError(
      400,
      `Slack message failed: ${typeof body.error === "string" ? body.error : response.statusText}`,
      "SLACK_MESSAGE_FAILED",
      body
    );
  }

  return {
    output: {
      provider: "slack",
      mode: "bot",
      ok: response.ok && Boolean(body.ok),
      status: response.status,
      body
    }
  };
};
