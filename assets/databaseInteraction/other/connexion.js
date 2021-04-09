const { objectWithDependance } = require('../base/object');
const database = require('../../../database-structure.json');

exports.Connexion = class extends objectWithDependance {

    constructor(connexion,boquette){
        super(
            connexion,
            database.connexion.name,
            database.connexion.fields,
            database.connexion.key,
            [
                {
                    OBJ : boquette,
                    field : database.connexion.dependance[0].field
                }
            ]
        )
    }
}