import fs from "fs/promises";
import { Client } from "discord.js";

let o: { [k: string]: { name: string; guild: string; date: number } } = {};

await fs
  .readFile(".tmp.json", "utf-8")
  .then((v) => (o = JSON.parse(v)))
  .catch(() => fs.writeFile(".tmp.json", JSON.stringify(o), "utf-8"));

interface Config {
  unbanDuration: number;
  duration: number;
  token: string;
}

const config: Config = JSON.parse(await fs.readFile("./config.json", "utf-8"));

const client = new Client({
  intents: ["GuildBans", "GuildMembers"],
});

// 5 minutes
const duration = config.duration * 1000;

client.on("guildMemberRemove", async (member) => {
  console.log(
    "leaved member",
    member.user.tag,
    "at",
    new Date().toLocaleString()
  );
  if (Date.now() - (member.joinedTimestamp ?? Date.now()) < duration) {
    await member.ban();
    console.log("banned member", member.user.tag);
    o[member.id] = {
      date: Date.now() + config.unbanDuration * 1000,
      guild: member.guild.id,
      name: member.user.tag,
    };
    await fs.writeFile(".tmp.json", JSON.stringify(o), "utf-8");
  }
});

const f = async () => {
  for (const [k, v] of Object.entries(o)) {
    if (v.date <= Date.now()) {
      const guild = await client.guilds.fetch(v.guild);
      try {
        await guild.members.unban(k);
        console.log(`unbanned user ${v.name}`);
        delete o[k];
        await fs.writeFile(".tmp.json", JSON.stringify(o), "utf-8");
      } catch (e) {
        console.error("エラーが発生しました。後で再試行します。");
        console.error(e);
        continue;
      }
    }
  }
  setTimeout(f, 16);
};

client.login(config.token).then(() => {
  console.log("bot started.");
  f();
});
