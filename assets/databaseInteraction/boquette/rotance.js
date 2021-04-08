const { objectWithDependance } = require("../base/object");
const database = require('../../../database-structure.json');

exports.Rotance = class extends objectWithDependance {

    constructor(connexion,boquetteOBJ){
        super(
            connexion,
            database.rotance.name,
            database.rotance.fields,
            database.rotance.key,
            [
                {
                    OBJ : boquetteOBJ,
                    field : database.rotance.dependance[0].field
                }
            ]
        )
    }
}