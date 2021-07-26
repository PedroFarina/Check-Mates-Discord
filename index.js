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
                    msg.reply(`you just added ${args.join(" ")} to your wishlist! If you participate in a rolling session with that item everyone will know about it.`);
                }
            });
            break;
        case "wishlist":
            if (args.shift() == "all") {
                listItem(msg.guild.id, null, (err, res) => {
                    if(err) {
                        msg.reply(err.message);
                    } else {
                        if (res.rows.length == 0) {
                            msg.channel.send(`No one from ${msg.guild.name} has made a wishlist yet. Begin yours by using !add right now :D`)
                            return;
                        }
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
                        if (res.rows.length == 0) {
                            msg.reply("you don't have any items on the wishlist yet. Use !add to start your wishlist.");
                            return;
                        }
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
            var index = -1;
            for(let i = 0; i < rolls.length; i++) {
                if(rolls[i].guildID == msg.guild.id) {
                    index = i;
                    break;
                }
            }
            switch(arg) {
                case "begin":
                case "init":
                    if(index == -1) {
                        rolls.push(new RollingSession(msg.guild.id, msg.channel));
                        msg.channel.send("Starting a rolling session :)");
                    } else {
                        msg.channel.send("There's already a rolling session going on your server. Use !roll cancel to stop it.");
                    }
                    break;
                case "erase":
                case "cancel":
                    if(index == -1) {
                        msg.channel.send("You can't cancel what doesn't exist lol. Try using !roll init to start a rolling session.");
                    } else {
                        rolls.splice(index, 1);
                        msg.channel.send("The rolling session has been canceled.");
                    }
                    break;
                case "enter":
                case "join":
                    if(index == -1) {
                        msg.reply("there's no rolling session going on. Use !roll init to start one.");
                    } else {
                        rolls[index].addPlayer(msg.author.id);
                        msg.reply("you joined the rolling session.");
                    }
                    break;
                case "joint":
                    if(index == -1) {
                        msg.reply("there's no rolling session going on. Use !roll init to start one.");
                    } else {
                        rolls[index].addPlayer(msg.author.id);
                        msg.reply("you joint the rolling session. ;)");
                    }
                    break;
                case "leave":
                case "withdraw":
                    if(index == -1) {
                        msg.reply("there's no rolling session going on. Use !roll init to start one.");
                    } else {
                        if (rolls[index].choosingPlayer == null) {
                            rolls[index].removePlayer(msg.author.id);
                            msg.reply("you left the rolling session.");
                        } else {
                            msg.reply("the rolling has already started. Wait for you turn and send !roll skip to leave.");
                        }
                    }
                    break;
                case "add":
                case "insert":
                    if(index == -1) {
                        msg.reply("there's no rolling session going on. Use !roll init to start one.");
                    } else {
                        var items = args.join(" ").split(",");
                        items.forEach(item => rolls[index].addItem(item));
                        msg.channel.send("Item(s) added to your rolling session!");
                    }
                    break;
                case "remove":
                case "delete":
                    if(index == -1) {
                        msg.reply("there's no rolling session going on. Use !roll init to start one.");
                    } else {
                        if (rolls[index].choosingPlayer == null) {
                            var items = args.join(" ").split(",");
                            items.forEach(item => rolls[index].removeItem(item));
                            msg.reply("Item(s) removed from your rolling session!");
                        } else {
                            msg.reply("the rolling has already started. You can still add items though.");
                        }
                    }
                    break;
                case "pick":
                case "choose":
                    if(index == -1) {
                        msg.reply("there's no rolling session going on. Use !roll init to start one.");
                    } else if ((msg.author.id == rolls[index].choosingPlayer) || (args[0] == "force" && msg.member.hasPermission("ADMINISTRATOR"))) {
                        if (args[0] == "force") args.shift();
                        const itemIndex = parseInt(args[0]);
                        if (itemIndex) {
                            const shouldEnd = rolls[index].pickItem(itemIndex);
                            if(shouldEnd == true) {
                                rolls.splice(index, 1);
                            } else if (shouldEnd == null) {
                                msg.reply("please user a proper input");
                            }
                        } else {
                            msg.reply("choose a proper number please.");
                        }
                    } else {
                        msg.reply("there's no specific order of roll yet.");
                    }
                    break;
                case "skip":
                    if (index == -1) {
                        msg.reply("there's no rolling session going on. Use !roll init to start one.");
                    } else if ((msg.author.id == rolls[index].choosingPlayer) || (args[0] == "force" && msg.member.hasPermission("ADMINISTRATOR"))) {
                        const shouldEnd = rolls[index].skipAndRemove();
                        if (shouldEnd == true) {
                            rolls.splice(index, 1);
                        } else if (shouldEnd == null) {
                            msg.reply("something wrong is not right. You're the choosing player, but you're not on the players list.")
                        }
                    } else {
                        if (rolls[index].choosingPlayer) {
                            msg.channel.send(`Yo <@${rolls[index].choosingPlayer}> hurry up, people are trying to steal your turn.`);
                        } else {
                            msg.reply("there's no specific order of roll yet.");
                        }
                    }
                    break;
                case "go":
                case "roll":
                    if(index == -1) {
                        msg.reply("there's no rolling session going on. Use !roll init to start one.");
                    } else {
                        if (rolls[index].startRoll()) {
                            msg.channel.send("Let the games begin!\nHit !roll choose {number} to choose an item if it's your turn, and !roll skip if you're done rolling.\nThe admin can also hit !roll skip force or !roll choose force {number}.");
                        } else {
                            msg.channel.send("Oops, you can't start a rolling session like that. Check if you have more than one player rolling and any item on the list.");
                        }
                    }
                    break;
                default:
                    msg.channel.send("I don't know how to respond to that");
                    break;
            }
            break;
    }
});

discordClient.login(process.env.BOT_TOKEN);