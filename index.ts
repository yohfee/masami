import { statSync, watch } from "fs";
import { extname, join } from "path";
import { Client } from "discord.js";

const { BOT_TOKEN } = process.env;
if (!BOT_TOKEN) {
  console.log("BOT_TOKEN environment variable is not set.");
  process.exit(1);
}

const [, , watchDir] = process.argv;
if (!watchDir) {
  console.log(`watchDir argument is not set.`);
  process.exit(1);
}
if (!statSync(watchDir).isDirectory()) {
  console.log(`"${watchDir}" is not a directory.`);
  process.exit(1);
}

const client = new Client().on(
  "message",
  async ({ guild, author: { bot }, member }) => {
    if (!guild || !member || bot) return;
    await member.voice.channel?.join();
  },
);

["SIGINT", "SIGTERM"].forEach((signal) => {
  process.on(signal, () => {
    client.voice?.connections?.forEach((connection) => connection.disconnect());
    client.destroy();
    process.exit(0);
  });
});

watch(watchDir, { persistent: true }, (event, filename) => {
  if (extname(filename) !== ".wav" || event !== "rename") return;
  const wav = join(watchDir, filename);
  client.voice?.connections.forEach((vc) => vc.play(wav));
});

client.login(BOT_TOKEN).catch((e) => {
  console.error(e);
  process.exit(1);
});
