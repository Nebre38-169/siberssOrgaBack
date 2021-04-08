const { object } = require("../base/object");
const database = require('../../../database-structure.json');

exports.Rotance = class extends object {

    constructor(connexion,boquetteOBJ){
        super(
            connexion,
            database.channel.name,
            database.channel.fields,
            database.channel.key
        )
    }
}