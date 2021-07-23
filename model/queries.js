const { Client } = require('pg');
const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});
client.connect((err) => {
    if (err) {
        console.log(err);
    }
});

module.exports = {
    insertItem: function(serverID, discordID, item, callback) {
        client.query(`INSERT INTO Wishlist(id_discord, item, id_guild) VALUES ('${discordID}', '${item}', '${serverID}');`, callback);
    },
    removeItem: function(serverID, discordID, item, callback) {
        client.query(`DELETE FROM Wishlist WHERE id_discord = '${discordID}' AND item = '${item}' AND id_guild='${serverID}';`, callback);
    },
    listItem: function(serverID, discordID, callback) {
        if (discordID) {
            client.query(`SELECT * FROM Wishlist WHERE id_discord = '${discordID}' AND id_guild='${serverID}';`, callback);
        } else {
            client.query(`SELECT * FROM Wishlist WHERE id_guild='${serverID}';`, callback);
        }
    }
};