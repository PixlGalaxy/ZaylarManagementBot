import express from 'express';
import dotenv from 'dotenv';
import { initDiscordClient } from './discordClient';
import { scheduleMaintenance } from './scheduler';

dotenv.config();

const app = express();

// Serve static files from "public", so "/css/tailwind.css" is available
app.use(express.static('public'));

// SINGLE GET "/" ROUTE – references local Tailwind from /css/tailwind.css
app.get('/', (req, res) => {
  const html = `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>ZaylarManagementBot - Schedule UI</title>
      <!-- Use the locally compiled Tailwind file -->
      <link rel="stylesheet" href="/css/tailwind.css" />
    </head>
    <body class="bg-gray-100 font-sans">
      <div class="max-w-xl mx-auto py-10 px-4">
        <h1 class="text-3xl font-bold text-center mb-6 text-purple-700">ZaylarManagementBot</h1>
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-2xl font-semibold mb-4 text-gray-800">Maintenance Scheduler</h2>
          <form action="/schedule" method="GET" class="space-y-4">
            <!-- Title -->
            <div>
              <label for="title" class="block mb-1 font-medium text-gray-700">Announcement Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value="Zaylar Server Scheduled Downtime"
                required
                class="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-purple-200"
              />
            </div>

            <!-- Description -->
            <div>
              <label for="description" class="block mb-1 font-medium text-gray-700">Description</label>
              <textarea
                id="description"
                name="description"
                rows="4"
                required
                class="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-purple-200"
              >Scheduled Downtime For Zaylar Server Maintenance</textarea>
            </div>

            <!-- Shutdown Time -->
            <div>
              <label for="shutdownTime" class="block mb-1 font-medium text-gray-700">Shutdown Time (YYYY-MM-DD HH:mm)</label>
              <input
                type="datetime-local"
                id="shutdownTime"
                name="shutdownTime"
                required
                class="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-purple-200"
              />
            </div>

            <!-- Maintenance End Time -->
            <div>
              <label for="maintenanceEndTime" class="block mb-1 font-medium text-gray-700">Maintenance End Time (YYYY-MM-DD HH:mm)</label>
              <input
                type="datetime-local"
                id="maintenanceEndTime"
                name="maintenanceEndTime"
                required
                class="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-purple-200"
              />
            </div>

            <!-- Channel ID -->
            <div>
              <label for="channelId" class="block mb-1 font-medium text-gray-700">Discord Channel ID (optional)</label>
              <input
                type="text"
                id="channelId"
                name="channelId"
                class="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-purple-200"
              />
            </div>

            <button
              type="submit"
              class="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              Schedule Maintenance
            </button>
          </form>
        </div>
      </div>
    </body>
  </html>
  `;
  res.send(html);
});

// KEEP THE "/schedule" ROUTE
app.get('/schedule', (req, res) => {
  try {
    const { shutdownTime, maintenanceEndTime, title, description, channelId } = req.query;

    if (!shutdownTime || !maintenanceEndTime || !title || !description) {
      return res.status(400).send("Missing one or more required query parameters.");
    }

    const parsedShutdownTime = new Date(shutdownTime as string);
    const parsedEndTime = new Date(maintenanceEndTime as string);

    const effectiveChannelId = (channelId as string) || process.env.CHANNEL_ID || "";
    if (!effectiveChannelId) {
      return res.status(400).send("No Discord channel ID provided or configured.");
    }

    scheduleMaintenance({
      shutdownTime: parsedShutdownTime,
      maintenanceEndTime: parsedEndTime,
      title: title as string,
      description: description as string,
      channelId: effectiveChannelId
    });

    return res.send(`
      <h2>Maintenance announcement scheduled</h2>
      <p><strong>Title:</strong> ${title}</p>
      <p><strong>Description:</strong> ${description}</p>
      <p><strong>Shutdown Time:</strong> ${shutdownTime}</p>
      <p><strong>Maintenance End Time:</strong> ${maintenanceEndTime}</p>
      <p><strong>Channel:</strong> ${effectiveChannelId}</p>
    `);
  } catch (error) {
    console.error("Error scheduling maintenance announcement:", error);
    return res.status(500).send("Internal server error.");
  }
});

/**
 * Initialize Discord and start the server
 */
async function main() {
  await initDiscordClient();
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`HTTP server listening on port ${port}`);
  });
}
main().catch((err) => {
  console.error("Failed to start the application:", err);
});
