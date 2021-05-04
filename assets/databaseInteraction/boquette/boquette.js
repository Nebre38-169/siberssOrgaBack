const { object } = require('../base/object');
const database = require('../../../database-structure.json');
const Logs = require('../../Logs');

exports.Boquette = class extends object {

    /**
     * 
     * @param {import('promise-mysql2').PoolConnection} connection 
     */
    constructor(connection){
        super(
            connection,
            database.boquette.name,
            database.boquette.fields,
            database.boquette.key
        )
    }


    /**
     * Return all user.
     * @param {{ field : string, value : any}} condition 
     * @param {string} param 
     * @param {string} opts 
     * @returns 
     */
    get(field,condition,opts){
        if(!field){
            field = 'id,name,respo,description,role,creationDate,updateDate';
        }
        if(field.includes('password')){
            field.replace('password','');
        }
        return super.get(field,condition,opts);
    }

    getById(id,param='*'){
        if(param==='*'){
            param = 'id,name,respo,description,role,creationDate,updateDate';
        }
        if(param.includes('password')){
            Logs.warning(`The password fields have been requested for user ${id}. This method is deprecated for security reasons`)
        }
        return super.getById(id,param);
    }

    getByKey(email,param='*'){
        if(param==='*'){
            param = 'id,name,respo,description,role,creationDate,updateDate';
        }
        if(param.includes('password')){
            Logs.warning(`The password fields have been requested for user ${email}. This method is deprecated for security reasons`)
        }
        return super.getByKey(email,param);
    }
}