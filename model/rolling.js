const { listAllItemsFrom } = require("./queries");

function shuffle(array) {
    var currentIndex = array.length,  randomIndex;
  
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
  
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
  
    return array;
}  

module.exports = class RollingSession {
    constructor(guildID, channel) {
        this.channel = channel;
        this.guildID = guildID;
        this.items = [];
        this.players = [];
    }

    addItem(item) {
        if (this.items.includes(item)) return;
        this.items.push(item);
    }
    removeItem(item) {
        let pos = this.items.indexOf(item);
        if (pos) {
            items.splice(pos, 1);
        }
    }

    addPlayer(player) {
        if (this.players.includes(player)) return;
        this.players.push(player);
    }

    removePlayer(player) {
        let pos = this.players.indexOf(player);
        if (pos) {
            player.splice(pos, 1);
        }
    }

    roll() {
        if (this.players.length == 1 || this.items.length == 0) return false;
        listAllItemsFrom(this.guildID, this.players, (err, res) => {
            if(err) {
                this.channel.send(err.message);
            } else {
                for(let i = 0; i < res.rows.length; i++) {
                    if (this.items.includes(res.rows[i]["item"])) {
                        this.channel.send(`<@${res.rows[i]["id_discord"]}> has ${res.rows[i]["item"]} on the wishlist.`);
                    }
                }
                var playersCopy = this.players.map((x) => x);
                for(let i=0; i < this.items.length; i++) {
                    shuffle(playersCopy);
                    this.channel.send(`<@${playersCopy.shift()}> picks an item.`);
                    if(playersCopy.length == 0) {
                        playersCopy = this.players.map((x) => x);
                    }
                }
            }
        });
        return true;
    }
}