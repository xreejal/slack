import { WebClient } from "@slack/web-api";

const slackToken = process.env.SLACK_BOT_TOKEN;
const client = new WebClient(slackToken);

export async function notifySlack(text: string, channel?: string) {
  const targetChannel = channel || process.env.SLACK_DEFAULT_CHANNEL;
  if (!slackToken) throw new Error("SLACK_BOT_TOKEN is not set");
  if (!targetChannel) throw new Error("No channel provided and SLACK_DEFAULT_CHANNEL not set");

  await client.chat.postMessage({ channel: targetChannel, text });
}


