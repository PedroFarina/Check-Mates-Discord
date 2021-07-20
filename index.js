require('dotenv/config')
const Discord = require("discord.js");
const client = new Discord.Client();

client.on("ready", () => {
    console.log("Logged in...");
});

const prefix = "!";
client.on("message", msg => {
    if (msg.author.bot) return;
    if (!msg.content.startsWith(prefix)) return;
    const commandBody = msg.cleanContent.slice(prefix.length);
    const args = commandBody.split(" ");
    const command = args.shift().toLowerCase();
    if(command == "add") {
        msg.reply("you just added " + args.join(" ") + " to your wishlist! In your next roll you'll receive a bonus if it's on the list.");
    } else if (command == "wishlist") {
        msg.reply("here's your wishlist.");
    } else if (command == "remove") {
        msg.reply("you just removed something that I still haven't programmed yet :D");
    }
});

client.login(process.env.BOT_TOKEN);
