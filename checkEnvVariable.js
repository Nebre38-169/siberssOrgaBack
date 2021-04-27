const envVar = require('dotenv').config({path : __dirname+'/.env'});


const varList = [
    'DB_HOST',
    'DB_USER',
    'DB_PASSWORD',
    'DB_SCHEMA',
    'DB_SSL',
    'SECRET',
    'PROTECTION',
    'SPICE'
]

/**
 * Check if every needed environement variable have been set
 * @returns { { status : boolean, missing : string[] } } 
 */
exports.checkEnvironnemt = () =>{
    let missing = [];
    if(envVar.error){
        throw envVar.error;
    }
    for(let v of varList){
        if(!Object.keys(envVar.parsed).includes(v)){
            missing.push(v);
        }
    }
    let status;
    if(missing.length>0){
        status = true;
    } else {
        status = false;
    }
    return { status, missing}
}

