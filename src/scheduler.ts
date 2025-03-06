import { discordClient } from './discordClient';
import { scheduleJob } from 'node-schedule';
import {
  EmbedBuilder,
  TextChannel
} from 'discord.js';

async function getServerStatus(): Promise<string> {
  const loginUrl = process.env.ZAYLAR_LOGIN_URL;
  if (!loginUrl) {
    console.error("ZAYLAR_LOGIN_URL is not defined.");
    return "🔴 OFFLINE"; 
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    const response = await fetch(loginUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.status === 200) {
      return "🟢 ONLINE";
    } else {
      return "🟡 INITIALIZING";
    }
  } catch (error) {
    return "🔴 OFFLINE";
  }
}

async function createEmbed(
  downtimeDescription: string,
  offlineTime: Date,
  onlineTime: Date
) {
  const currentStatus = await getServerStatus();
  const statusUrl = "https://onlinestatus.itzgalaxy.com/";

  const embed = new EmbedBuilder()
    .setTitle("Zaylar Server Scheduled Downtime")
    .setDescription(downtimeDescription)
    .setColor(0x8411f0)
    .addFields(
      {
        name: "Scheduled Service Shutdown Time:",
        value: offlineTime.toLocaleString(),
        inline: false
      },
      {
        name: "Maintenance Estimated Ending Time:",
        value: onlineTime.toLocaleString(),
        inline: false
      },
      {
        name: "ItzGalaxy Online Status",
        value: `[Online Status](${statusUrl})`,
        inline: false
      }
    )
    .setFooter({
      text: `Zaylar Server Status: ${currentStatus}`,
      iconURL: "https://raw.githubusercontent.com/enderman0016/Zaylar-Data/main/Zaylar%20Icon.jpeg"
    });

  const botAvatar = discordClient.user?.displayAvatarURL();
  if (botAvatar) {
    embed.setThumbnail(botAvatar);
  }

  return embed;
}

interface MaintenanceSchedule {
  shutdownTime: Date;
  maintenanceEndTime: Date;
  title: string;
  description: string;
  channelId: string;
}

export function scheduleMaintenance({
  shutdownTime,
  maintenanceEndTime,
  title,
  description,
  channelId
}: MaintenanceSchedule): void {
  console.log("Scheduling a maintenance announcement...");

  scheduleJob(shutdownTime, async () => {
    try {
      const channel = await discordClient.channels.fetch(channelId);

      if (!channel || channel.type !== 0) {
        console.error("Channel not found or is not a text channel.");
        return;
      }

      const embed = await createEmbed(description, shutdownTime, maintenanceEndTime);

      await (channel as TextChannel).send({
        content: "@everyone",
        embeds: [embed],
        allowedMentions: { parse: ["everyone"] }
      });

      console.log("Maintenance announcement sent successfully.");
    } catch (error) {
      console.error("Failed to send maintenance announcement:", error);
    }
  });

  console.log("Maintenance announcement scheduled for:", shutdownTime);
}
