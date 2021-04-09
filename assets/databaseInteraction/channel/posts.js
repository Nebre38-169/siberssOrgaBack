const { objectWithDependance } = require("../base/object");
const database = require('../../../database-structure.json');

exports.Posts = class extends objectWithDependance {

    constructor(connexion,boquetteOBJ,channelOBJ){
        super(
            connexion,
            database.posts.name,
            database.posts.fields,
            database.posts.key,
            [
                {
                    OBJ : boquetteOBJ,
                    field : database.posts.dependance[0].field
                },
                {
                    OBJ : channelOBJ,
                    field : database.posts.dependance[1].field
                }
            ]
        )
    }
}