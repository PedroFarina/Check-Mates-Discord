require('dotenv/config');
const express = require('express');
const PORT = process.env.PORT || 5000;

express().listen(PORT, () => console.log(`Listening on ${ PORT }`));

const { Client } = require('pg');
const databaseClient = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});
databaseClient.connect((err) => {
    if (err) {
        console.log(err);
    }
});
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
        case "generate":
            if (args.shift() == "wishlist") {
                if (msg.member.hasPermission("ADMINISTRATOR")) {
                    msg.reply("generating wishlist system...")
                    databaseClient.query("CREATE TABLE Wishlist(id_wishlist serial PRIMARY KEY, id_discord varchar(255) NOT NULL, item varchar(255) NOT NULL);", (err, res) => {
                        if (err) {
                            msg.reply(err.message);
                        } else {
                            msg.reply("successfuly generated! Now you can begin your wishlist for items you'll never get :D");
                        }
                    });
                } else {
                    msg.reply("you have no permissions to do that.")
                }
            }
            break;
        case "delete":
            if (args.shift() == "wishlist") {
                if (msg.member.hasPermission("ADMINISTRATOR")) {
                    msg.reply("oh well... okay");
                    databaseClient.query("DROP TABLE Wishlist;", (err, res) => {
                        if (err) {
                            msg.reply(err.message);
                        } else {
                            msg.reply("done ;D");
                        }
                    });
                } else {
                    msg.reply("you have no permissions to do that.");
                }
            }
        case "add":
            databaseClient.query("INSERT INTO Wishlist(id_discord, item) VALUES ('" + msg.member.id + "', '" + args.join(" ") + "');", (err, res) => {
                if (err) {
                    msg.reply(err.message);
                } else {
                    msg.reply(`you just added ${args.join(" ")} to your wishlist! In your next roll you'll receive a bonus if it's on the list.`);
                }
            });
            break;
        case "wishlist":
            if (args.shift() == "all") {
                databaseClient.query("SELECT * FROM Wishlist;", (err, res) => {
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
                databaseClient.query(`SELECT * FROM Wishlist WHERE id_discord = '${msg.member.id }';` , (err, res) => {
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
            databaseClient.query(`DELETE FROM Wishlist WHERE id_discord = '${msg.member.id}' AND item = '${args.join(" ")}';`, (err, res) => {
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
