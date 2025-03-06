import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

export const discordClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

export async function initDiscordClient(): Promise<void> {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    throw new Error("DISCORD_BOT_TOKEN is not defined in .env");
  }

  discordClient.once('ready', () => {
    console.log(`Discord bot connected as: ${discordClient.user?.tag}`);
  });

  await discordClient.login(token);
}
