require('dotenv/config');
const express = require('express');
const PORT = process.env.PORT || 5000;

express().listen(PORT, () => console.log(`Listening on ${ PORT }`));

const { insertItem, removeItem, listItem } = require('./model/queries');
const Discord = require("discord.js");
const RollingSession = require('./model/rolling');
const discordClient = new Discord.Client();

discordClient.on("ready", () => {
    console.log("Logged in...");
});

var rolls = [];
const prefix = "!";
discordClient.on("message", msg => {
    if (msg.author.bot) return;
    if (!msg.content.startsWith(prefix)) return;
    const commandBody = msg.cleanContent.slice(prefix.length);
    const args = commandBody.split(" ");
    const command = args.shift().toLowerCase();
    if(commandBody.includes(";") || commandBody.includes(")") || commandBody.includes("=")) {
        msg.reply("could you please not SQL inject me bro?");
        return;
    }
    switch(command) {
        case "add":
            insertItem(msg.guild.id, msg.member.id, args.join(" "), (err, res) => {
                if (err) {
                    msg.reply(err.message);
                } else {
                    msg.reply(`you just added ${args.join(" ")} to your wishlist! In your next roll you'll receive a bonus if it's on the list.`);
                }
            });
            break;
        case "wishlist":
            if (args.shift() == "all") {
                listItem(msg.guild.id, null, (err, res) => {
                    if(err) {
                        msg.reply(err.message);
                    } else {
                        var returnString = `${msg.guild.name}'s Wishlist:\n`;
                        for(let i = 0; i < res.rows.length; i++) {
                            returnString += `<@${res.rows[i]["id_discord"]}> - ${res.rows[i]["item"]}\n`;
                        }
                        msg.channel.send(returnString.slice(0, -2));
                    }
                });
            } else {
                listItem(msg.guild.id, msg.member.id, (err, res) => {
                    if (err) {
                        msg.reply(err.message);
                    } else {
                        var returnString = "";
                        for(let i = 0; i < res.rows.length; i++) {
                            returnString += `${i.toString()} - ${res.rows[i]["item"]}\n`;
                        }
                        msg.channel.send(returnString.slice(0, -1));
                    }
                });
            }
            break;
        case "remove":
            removeItem(msg.guild.id, msg.member.id, args.join(" ").trim(), (err, res) => {
                if(err) {
                    msg.reply(err.message);
                } else {
                    msg.reply(`you successfully removed ${args.join(" ")} from your wishlist.`);
                }
            });
            break;
        case "roll":
            let arg = args.shift()
            var found = false;
            if (arg == "start") {
                for(let i = 0; i < rolls.length; i++) {
                    if(rolls[i].guildID == msg.guild.id) {
                        found = true;
                        break;
                    }
                }
                if(found) {
                    msg.channel.send("There's already a rolling session going on your server.");
                } else {
                    rolls.push(new RollingSession(msg.guild.id, msg.channel));
                    msg.channel.send("Starting a rolling session :)");
                }
            } else if (arg == "erase") {
                for(let i = 0; i < rolls.length; i++) {
                    if(rolls[i].guildID == msg.guild.id) {
                        found = true;
                        rolls.splice(i, 1);
                        break;
                    }
                }
                if(found) {
                    msg.channel.send("Your rolling session has been erased.");
                } else {
                    msg.channel.send("There's no rolling session going on yet.");
                }
            } else if (arg == "join") {
                for(let i = 0; i < rolls.length; i++) {
                    if(rolls[i].guildID == msg.guild.id) {
                        found = true;
                        rolls[i].addPlayer(msg.author.id);
                        break;
                    }
                }
                if(found) {
                    msg.reply("you were added to the rolling session.");
                } else {
                    msg.reply("there's no rolling session going on.");
                }
            } else if (arg == "add") {
                for(let i = 0; i < rolls.length; i++) {
                    if(rolls[i].guildID == msg.guild.id) {
                        found = true;
                        var items = args.join(" ").split(",");
                        items.forEach(item => rolls[i].addItem(item));
                        break;
                    }
                }
                if (found) {
                    msg.channel.send("Nice!");
                } else {
                    msg.reply("there's no rolling session going on.");
                }
            } else if (arg == "go") {
                for(let i = 0; i < rolls.length; i++) {
                    if(rolls[i].guildID == msg.guild.id) {
                        found = true;
                        if (rolls[i].roll()) {
                            msg.channel.send("Nice rolls, cya later :D");
                            rolls.splice(i, 1);
                        } else {
                            msg.channel.send("Oops, you can't start a rolling session like that. Check if you have more than one player rolling and any item on the list.");
                        }
                        break;
                    }
                }
                if (!found) {
                    msg.reply("there's no rolling session going on.");
                }
            } else {
                msg.reply("I have no such command.");
            }
            break;
    }
});

discordClient.login(process.env.BOT_TOKEN);