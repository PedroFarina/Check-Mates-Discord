require('dotenv/config');
const express = require('express');
const PORT = process.env.PORT || 5000;

express().listen(PORT, () => console.log(`Listening on ${ PORT }`));

const { insertItem, removeItem, listItem } = require('./model/queries');
const Discord = require("discord.js");
const discordClient = new Discord.Client();

discordClient.on("ready", () => {
    console.log("Logged in...");
});

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
            removeItem(msg.guild.id, args.join(" "), msg.member.id, (err, res) => {
                if(err) {
                    msg.reply(err.message);
                } else {
                    msg.reply(`you successfully removed ${args.join(" ")} from your wishlist.`);
                }
            });
            break;
    }
});

discordClient.login(process.env.BOT_TOKEN);
