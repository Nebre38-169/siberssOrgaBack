const Logs = require("../../Logs");
const config = require('../../../config.json');

exports.object = class {

    /**
     * Return an object to handle CRUD method for basic object in the database
     * It is recommended to use pool connection rather than single connection
     * @param {import('promise-mysql2').PoolConnection} connection 
     * @param {string} tableName 
     * @param {string[]} tableColumns 
     * @param {string} tableKey 
     */
    constructor(connection,tableName,tableColumns,tableKey){
        this.table = tableName;
        this.db = connection;
        this.params = tableColumns;
        this.keyName = tableKey;
    }

    /**
     * 
     * @param {} option 
     */
    getOption(option){
        let res = "";
        if(option.ordre){
            res+=` ORDER BY ${option.ordre.champs}`
            if(option.ordre.asc){
                res+=` ASC`
            } else {
                res+= ` DESC`
            }
        }
        if(option.limit){
            res+=` LIMIT ${option.limit}`;
            if(option.start){
                res+=` OFFSET ${option.start}`
            }
        }
        return res;
    }

    /**
     * 
     * @param {string} field 
     * @param {{ field:string, value : any }} condition 
     * @param {} opts 
     * 
     */
    getSelectQuery(field,table,condition,opts){
        field = field || '*';
        let query = `SELECT ${field} FROM ${table}`
        if(condition){
            let conditionStr = ` WHERE ${condition.field}="${condition.value}"`;
            query+=conditionStr;
        }
        if(opts!=undefined){
            let optsStr = this.getOption(opts);
            query+=optsStr;
        }
        console.log(query);
        return query;
    }

    /**
     * 
     * @param {Date} date 
     */
    getDateStr(date){
        return `${date.getFullYear()}-${date.getMonth()-1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
    }
    
    /**
     * Get all element of the table. Return all the columns expect if specified otherwise
     * @param {} field
     * @param {} condition
     * @param {} option
     */
    get(field,condition,option){
        return new Promise((next)=>{
            let query = this.getSelectQuery(field,this.table,condition,option);
            this.db.query(query)
            .then(([result,fields])=>{
                Logs.info(`Requested all entry in table ${this.table}`);
                next(result);
            })
            .catch((err)=>{
                Logs.error('object.get',err);
                next(new Error('internal error'));
            })
        })
    }

    /**
     * Returns the element with the matching id. If no element matches the id, return an error
     * param are the columns returned 
     * @param {number} id 
     * @param {string} param 
     */
    getById(id,field,opts){
        return new Promise((next)=>{
            let query = this.getSelectQuery(field,this.table,{ field : "id",value : id},opts);
            this.db.query(query)
            .then(([result,fields])=>{
                Logs.info(`Requested element with id ${id} in table ${this.table}`);
                if(result[0] != undefined){
                    Logs.info('Found one');
                    next(result[0]);
                } else {
                    Logs.warning(`No element found with the id ${id}`);
                    next(new Error('No entry with the matching id'));
                }
            })
            .catch((err)=>{
                Logs.error('object.getById',err);
                next(new Error('internal error'));
            })
        })
    }
    
    /**
     * 
     * @param {any} keyValue 
     * @param {string} param 
     * @param {string} opts 
     * @returns {Promise<any | Error>}
     */
    getByKey(keyValue,field,opts){
        return new Promise(next =>{
            let query = this.getSelectQuery(field,this.table,{ field : this.keyName,value:keyValue},opts);
            this.db.query(query)
            .then(([res,fields]) =>{
                if(res[0]!=undefined){
                    Logs.info(`Requested entry from ${this.table} with key ${keyValue}`);
                    next(res[0]);
                } else {
                    Logs.warning(`No entry found for key ${keyValue} in table ${this.table}`);
                    next(new Error('No entry matching this key'));
                }
            })
            .catch(err =>{
                Logs.error('object.getByKey',err);
                next(new Error('internal error'));
            })
        })
    }


    /**
     * Return the number of entries in the table.
     */
    getCount(){
        return new Promise((next)=>{
            let query = `SELECT COUNT(id) FROM ${this.table}`;
            this.db.query(query)
            .then(([result,fields]) =>{
                if(result[0]!=undefined){
                    let count = result[0]['COUNT(id)'];
                    Logs.info(`Requested the count of entries in table ${this.table}. Found ${count}`);
                    next(count);
                } else {
                    Logs.warning(`Requested the count of entries in table ${this.table}. Found none`);
                    next(new Error('Error'));
                }
            })
            .catch(err=>{
                Logs.error('object.getCount',err);
                next(new Error('internal error'));
            })
        })
    }

    /*
    For an INSERT INTO sql command the syntaxe is either :
    INSERT INTO table (columns)
    VALUES (columns values)
    or :
    INSERT INTO table
    VALUES (all values matching the columns order)
    I rather use the second one, as most of the table require all columns to be filled with data
    */
    
    /**
     * Construct and return the query to achive an insert into the table
     * @param {*} values 
     * @returns {string}
     */
    constructQueryInsertStr(values){
        let query = `INSERT INTO ${this.table} VALUES (`;
        for(let column of this.params){
            if(column!='creationDate' && column!='updateDate'){
                if(values[column]!=undefined){
                    query = query + `"${values[column]}",`;
                } else {
                    query += 'null,';
                }
            } else if (column==='creationDate'){
                query = query + `?,`
            } else if (column==='updateDate'){
                query = query + `?,`
            }
        }
        query = query.slice(0,query.length-1);
        query+=')';
        return query;
    }

    /**
     * Add an element in the table with the speciefed table. Values need to match every columns of the table
     * @param {any} values
     */
    post(values){
        return new Promise((next)=>{
            let query = this.constructQueryInsertStr(values);
            console.log(query);
            this.db.query(query,[new Date(),new Date()])
            .then(([result,fields])=>{
                Logs.info(`Inserted element ${values[this.keyName]} in table ${this.table}`);
                next(result.insertId)
            })
            .catch((err)=>{
                Logs.error('object.post',err);
                next(new Error('internal error'));
            })
        })
    }

    /**
     * Check if a element with the specified value of the param already exist with a different id
     * @param {any} keyValue
     * @param {number} id 
     */
    checkExistance(KeyValue,id){
        return new Promise((next)=>{
            let query = `SELECT * FROM ${this.table} WHERE ${this.keyName}="${KeyValue}"`;
            this.db.query(query)
            .then(([result,fields])=>{
                if(result[0] !=undefined && parseInt(result[0].id)!=id){
                    next(true);
                } else {
                    next(false);
                }
            })
            .catch((err)=>{
                Logs.error('object.checkExistance',err);
                next(new Error('internal error'));
            })
        })
    }

    /**
     * Check if the needed values to create a new element are in the values object 
     * @param {any} values 
     */
    checkFields(values){
        let result = true;
        for(let field of this.params){
            if(field!='id' && field!='creationDate' && field!='updateDate' && field!='password'){
                if(!values[field]){
                    result = false;
                }
            }
        }
        console.log(result);
        return result
    }

    /**
     * Create a new element if it doesn't already exist in the table
     * @param {any[]} values 
     * @param {any} keyValue
     * @returns {Promise<string|Error>}
     */
    createNew(values){
        return new Promise((next)=>{
            this.checkExistance(values[this.keyName])
            .then((existance)=>{
                if(existance){
                    //The object with the same key already exist
                    Logs.warning(`Element in ${this.table} already exist with the same ${this.keyName}`)
                    next(new Error(`Element in ${this.table} already exist with the same ${this.keyName}`));
                } else {
                    this.post(values)
                    .then((result)=>{
                        next(result)
                    })
                    .catch((err)=>{
                        Logs.error('object.createNew',err);
                        next(new Error('internal error'));
                    })
                }
            })
            .catch((err)=>{
                Logs.error('object.createNew',err);
                next(new Error('internal error'));
            })
        })
    }

    /*
    For an update there is only one syntaxe :
    UPDATE table
    SET column_1='value 1', column_2='value 2',...
    WHERE condition
    */

    /**
     * Constructure the query for on update,
     * @param {any} values 
     * @returns {string}
     */
    constructQueryUpdateStr(id,values){
        let query = `UPDATE ${this.table} SET `;
        for(let column of Object.keys(values)){
            if(column!='creationDate' && column!='updateDate'){
                if(values[column]!=undefined){
                    query += ` ${column}="${values[column]}",`;
                }
            } else if(column==='updateDate') {
                query += ` ${column}=?,`;
            }
        }
        query = query.slice(0,query.length-1);
        query += ` WHERE id=${id}`;
        return query
    }

    /**
     * Update an element by checking if the key value is not already taken
     * @param {number} id 
     * @param {any[]} values 
     * @param {any} keyValue 
     */
    update(id,values){
        return new Promise((next)=>{
            this.checkExistance(values[this.keyName],id)
            .then((existance)=>{
                if(existance){
                    Logs.warning(`Element in ${this.table} already exist with the same ${this.keyName}`)
                    next(new Error(`Element in ${this.table} already exist with the same ${this.keyName}`));
                }else {
                    let query = this.constructQueryUpdateStr(id,values);
                    console.log(query);
                    this.db.query(query,[new Date()])
                    .then(([result,fields])=>{
                        Logs.info(`UPDATED element ${values[this.keyName]} from table ${this.table}`);
                        next(result);
                    })
                    .catch((err)=>{
                        Logs.error('object.update',err);
                        next(new Error('internal error'));
                    })
                }
            })
            .catch((err)=>{
                Logs.error('object.update',err);
                next(new Error('internal error'));
            })
        })
    }

    /**
     * Delete element of the table with the same id and retuns it.
     * @param {number} id 
     */
    delete(id){
        return new Promise((next)=>{
            this.getById(id)
            .then(result =>{
                this.db.query(`DELETE FROM ${this.table} WHERE id=?`,[id])
                .then(([val,fields])=>{
                    Logs.info(`DELETED element ${result[this.keyName]} from table ${this.table}`);
                    next(result);
                })
                .catch((err)=>{
                    Logs.error('object.delete',err);
                    next(new Error('internal error'));
                })
            })
            .catch((err)=>{
                Logs.error('object.delete',err);
                next(new Error('internal error'));
            })
        })
    }
}
exports.objectWithDependance = class extends this.object {

    /**
     * Create an object to interact with the specified table. The dependance object is an another database object which is required for this element to exist in the db.
     * @param {import("mysql").Connection} db 
     * @param {string} table 
     * @param {string[]} columns 
     * @param {string} key 
     * @param {{ OBJ : object, column : string}[]} dependances
     */
    constructor(db,table,colums,key,dependances){
        super(db,table,colums,key)
        this.dependances = dependances;
        
    }


    checkExistanceOfDependance(values){
        return new Promise(async(next) =>{
            let i = 0;
            let error = false;
            let message;
            while(i<this.dependances.length && !error){
                let result = await this.dependances[i].OBJ.getById(values[this.dependances[i].field]);
                if(result instanceof Error){
                    error = true;
                    message = `Missing dependance for ${this.dependances[i].field}`;
                }
                i++;
            }
            if(error){
                next(new Error(message));
            } else {
                next(true);
            }
        })
    }

    /**
     * Create a new element by checking if the dependance exist in a another table
     * @param {any[]} values 
     * @param {any} keyValue 
     * @param {number} idDepencance 
     */
    createNew(values){
        return new Promise((next)=>{
            this.checkExistanceOfDependance(values)
            .then(res =>{
                if(res instanceof Error){
                    Logs.warning(`Missing dependance to create an item in ${this.table}. Message : ${res.message}`);
                    next(res);
                } else {
                    super.createNew(values)
                    .then(res =>{
                        next(res);
                    })
                    .catch(err =>{
                        Logs.error('objectWithDependance.createNew',err);
                        next(new Error('internal error'));
                    })
                }
            })
            .catch(err =>{
                Logs.error('objectWithDependance.createNew',err);
                next(new Error('internal error'));
            })
        })
    }

    /**
     * Update an element by checking if the depand
     * @param {number} id 
     * @param {any[]} values 
     * @param {any} keyValue 
     * @param {number} idDepencance 
     */
    update(id,values){
        return new Promise((next)=>{
            this.checkExistanceOfDependance(values)
            .then((result)=>{
                if(result instanceof Error){
                    Logs.warning(`Missing dependance to create an item in ${this.table}. Message : ${result.message}`);
                    next(new Error(`Missing dependance to create an item in ${this.table}. Message : ${result.message}`));
                } else {
                    super.update(id,values)
                    .then((result)=>{
                        next(result)
                    })
                    .catch((err)=>{
                        Logs.error('objectWithDependance.update',err);
                        next(new Error('internal error'));
                    })
                }
            })
            .catch((err)=>{
                Logs.error('objectWithDependance.update',err);
                next(new Error('internal error'));
            })
        })
    }

    getByDependance(id,dependance,field,opts){
        return new Promise((next)=>{
            let query = this.getSelectQuery(field,this.table,{ field : dependance,value:id},opts);
            this.db.query(query)
            .then(([result,fields])=>{
                Logs.info(`Requested all entry of table ${this.table} with the field ${field} equal to ${id}`);
                next(result);
            })
            .catch((err)=>{
                Logs.error('objectWithDependance.getByDependance',err);
                next(new Error('internal error'));
            })
        })
    }


    deleteByDependance(idDepencance,field){
        return new Promise((next)=>{
            let query = `DELETE FROM ${this.table} WHERE ${field}=${idDepencance}`;
            this.db.query(query)
            .then(([result,fields])=>{
                Logs.info(`Deleted all entry of table ${this.table} with the field ${field} equal to ${id}`);
                next(result);
            })
            .catch((err)=>{
                Logs.error('objectWithDependance.deleteByDependance',err);
                next(new Error('internal error'));
            })
        })
    }
}