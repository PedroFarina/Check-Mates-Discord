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
        this.chosenItems = [];
        this.nextPlayers = [];
        this.choosingPlayer = null;
    }

    addItem(item) {
        if (this.items.includes(item)) return;
        this.items.push(item);
    }
    removeItem(item) {
        let pos = this.items.indexOf(item);
        if (pos != -1) {
            this.items.splice(pos, 1);
        }
    }

    addPlayer(player) {
        if (this.players.includes(player)) return;
        this.players.push(player);
    }

    removePlayer(player) {
        let pos = this.players.indexOf(player);
        if (pos != -1) {
            this.players.splice(pos, 1);
        }
    }

    startRoll() {
        if (this.players.length == 1 || this.items.length == 0) return false;
        listAllItemsFrom(this.guildID, this.players, (err, res) => {
            if(err) {
                this.channel.send(err.message);
            } else {
                var lowerCasedItems = this.items.map((x) => x.toLowerCase());
                var wishlistString = "";
                for(let i = 0; i < res.rows.length; i++) {
                    if (lowerCasedItems.includes(res.rows[i]["item"].toLowerCase())) {
                        wishlistString += `<@${res.rows[i]["id_discord"]}> has ${res.rows[i]["item"]} on the wishlist.\n`;
                    }
                }
                wishlistString = wishlistString.slice(0, -1);
                this.channel.send(wishlistString);
                this.nextPlayer();
            }
        });
        return true;
    }

    printItemsString() {
        var itemsString = "You're rolling for:\n";
        this.items.sort()
        for(let i=0; i < this.items.length; i++) {
            itemsString += `${i} - ${this.items[i]}\n`;
        }
        itemsString = itemsString.slice(0, -1);
        return itemsString;
    }

    setOrder() {
        if(this.nextPlayers.length == 0) {
            this.nextPlayers = this.players.map((x) => x);
        }
        shuffle(this.nextPlayers);
    }

    nextPlayer() {
        this.setOrder();
        this.choosingPlayer = this.nextPlayers.shift();
        this.channel.send(`${this.printItemsString()}\n<@${this.choosingPlayer}> it's your turn to pick an item.`);
    }

    pickItem(itemIndex) {
        if (this.items[itemIndex] == null) return null;
        var choseString = `<@${this.choosingPlayer}> chose ${this.items[itemIndex]}.`;
        this.items.splice(itemIndex, 1);
        this.chosenItems.push(choseString);
        this.channel.send(choseString)
        if(this.items.length == 0) {
            this.printChosenItems();
            return true;
        } else {
            this.nextPlayer();
            return false;
        }
    }

    skipAndRemove() {
        const index = this.players.indexOf(this.choosingPlayer);
        if (index != -1) {
            this.players.splice(index, 1);
        } else {
            return null;
        }
        if (this.players.length == 0) {
            this.printChosenItems();
            return true;
        } else {
            this.nextPlayer();
            return false;
        }
    }

    printChosenItems() {
        var allChosenItems = "";
            this.chosenItems.sort();
            for (let i = 0; i < this.chosenItems.length; i++) {
                allChosenItems += this.chosenItems[i] + "\n";
            }
            this.channel.send(allChosenItems.slice(0, -1));
    }
}