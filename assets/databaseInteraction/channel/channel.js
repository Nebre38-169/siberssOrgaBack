const { object } = require("../base/object");
const database = require('../../../database-structure.json');

exports.Channel = class extends object {

    constructor(connexion){
        super(
            connexion,
            database.channel.name,
            database.channel.fields,
            database.channel.key
        )
    }
}