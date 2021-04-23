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

    get(condition,param,opts){
        if(opts==="*"){
            return super.get(condition,param,{
                order : {
                    champs : 'date',
                    asc : false
                }
            });
        } else {
            return super.get(condition,param,opts);
        }
    }

    getByDependance(id,dependance,field,opts){
        if(!opts){
            return super.getByDependance(id,dependance,field,{
                ordre : {
                    champs : 'date',
                    asc : false
                }
            });
        } else {
            return super.getByDependance(id,dependance,field,opts);
        }
    }
}