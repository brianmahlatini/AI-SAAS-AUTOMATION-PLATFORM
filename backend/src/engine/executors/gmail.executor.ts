import { google } from "googleapis";
import { AppError } from "../../middleware/error";
import { renderTemplate } from "../template";
import type { NodeExecutor } from "../types";

export const executeGmailNode: NodeExecutor = async (node, context) => {
  const data = renderTemplate(node.data ?? {}, {
    trigger: context.trigger,
    steps: context.steps
  }) as Record<string, unknown>;

  const accessToken = String(data.accessToken ?? "");
  const to = String(data.to ?? "");
  const subject = String(data.subject ?? "");
  const body = String(data.body ?? "");

  if (!accessToken || !to || !subject || !body) {
    throw new AppError(
      400,
      "Gmail node requires accessToken, to, subject, and body",
      "NODE_CONFIG_INVALID"
    );
  }

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });
  const message = [
    `To: ${to}`,
    `Subject: ${subject}`,
    "Content-Type: text/plain; charset=utf-8",
    "",
    body
  ].join("\n");

  const encoded = Buffer.from(message).toString("base64url");
  const response = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: encoded
    }
  });

  return {
    output: {
      provider: "gmail",
      messageId: response.data.id,
      threadId: response.data.threadId
    }
  };
};
