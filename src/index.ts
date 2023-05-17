import fs from "fs/promises"
import {Client} from "discord.js"

interface Config {
  duration: number
  token: string
}

const config: Config = JSON.parse(await fs.readFile("./config.json", "utf-8"))

const client = new Client({
  intents: [ "GuildBans", "GuildMembers" ]
})

// 5 minutes
const duration = config.duration * 1000

client.on("guildMemberRemove", member => {
  console.log("leaved member", member.user.tag, "at", new Date().toLocaleString())
  if ((Date.now() - (member.joinedTimestamp ?? Date.now())) < duration){
    member.ban()
    console.log("banned member", member.user.tag)
  }
})

client.login(config.token).then(() => console.log("bot started."))