const { object } = require('../base/object');
const database = require('../../../database-structure.json');
const Logs = require('../../logs');

exports.User = class extends object {

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
     * @param {string} condition 
     * @param {string} param 
     * @param {string} opts 
     * @returns 
     */
    get(condition='*',param='*',opts='*'){
        if(param==='*'){
            param = 'id,name,respo,description,role,creationDate,updateDate';
        }
        if(param.includes('password')){
            param.replace('password','');
        }
        return super.get(condition,param,opts);
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