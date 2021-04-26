const mysql = require('promise-mysql2');
const Logs = require('./Logs');
const { checkAndChange } = require('./fonctions');

var env = process.env.NODE_ENV || 'development';
var protectionMode = process.env.PROTECTION || true;

param = {
    host : process.env.DB_HOST,
    user : process.env.DB_USER,
    password : process.env.DB_PASSWORD,
    database : process.env.DB_SCHEMA,
    port : process.env.DB_PORT || '3306',
    ssl : (process.env.DB_SSL==='true') || false
}

class middleware {

    /**
     * Write the information of the incoming connexion
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
    static logs(req,res,next){
        Logs.connexion(req);
        next();
    }

    static delay(dateConnexion){
        let timeStamp = new Date(dateConnexion);
        timeStamp.setHours(timeStamp.getHours()+1);
        return (new Date()).getTime() - timeStamp.getTime();
    }

    static checkSpice(req,res){
        return (req.headers.spice===process.env.SPICE);
    }

    /**
     * If the PROTECTION is on, will check if the coming request has the spice to recognize the application
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
    static spice(req,res,next){
        if(!protectionMode || middleware.checkSpice(req,res)){
            next();
        } else {
            res.status(403).json(checkAndChange(new Error('unauthorized')));
        }
    }

    static checkLogin(req,res){
        return new Promise(next=>{
            mysql.createConnection(param)
            .then(db =>{
                console.log(req.headers.token);
                db.query(`SELECT * FROM connexion where token='${req.headers.token}'`)
                .then(([result,field]) =>{
                    db.end();
                    console.log(result);
                    if(result[0]!=undefined){
                        if(middleware.delay(result[0].creationDate)<3600*1000){
                            Logs.info(`User ${result[0].user} is connected`);
                            next(true);
                        } else {
                            Logs.info(`User was found but the token is expired`);
                            next(false);
                        }
                    } else {
                        Logs.info('No token found');
                        next(false);
                    }
                })
                .catch((err)=>{
                    Logs.error('middleware.checkingLogin',err)
                    next(false);
                })
            })
            .catch((err)=>{
                Logs.error('middleware.checkingLogin',err)
                next(false);
            })
        })
    }

    /**
     * if the PROTECTION is on, will check if the coming connexion has a token to identify it self.
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
     static async login(req,res,next){
        let log = await middleware.checkLogin(req,res);
        if(!protectionMode){
            next();
        } else {
            if(middleware.checkSpice(req,res)&&log){
                next();
            } else {
                res.status(403).json(checkAndChange(new Error('unauthorized')));
            }
        }
    }

    static checkAdmin(req,res){
        return new Promise(next =>{
            mysql.createConnection(param)
            .then(db =>{
                db.query('SELECT name,role FROM boquette where id=?',[req.headers.boquetteid])
                .then(([result,field]) =>{
                    db.end();
                    if(result[0]!=undefined){
                        if(result[0].role==='admin'){
                            Logs.info(`The admin ${result[0].name} is connected `);
                            next(true);
                        } else {
                            Logs.info(`The user is not an admin`);
                            next(false);
                        }
                    } else {
                        console.log('t');
                        Logs.info(`No user was found`);
                        next(false);
                    }
                })
                .catch((err)=>{
                    Logs.error('middleware.checkAdmin',err);
                    next(false);
                }) 
            })
            .catch((err)=>{
                Logs.error('middleware.checkAdmin',err);
                next(false);
            })
        })
    }

    /**
     * If the PROTECTION is on, will check if the coming token is corresponding with a boquette which is admin
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
    static async admin(req,res,next){
        if(!protectionMode){
            next();
        } else {
            let spice = middleware.checkSpice(req,res);
            if(spice){
                let log = await middleware.checkLogin(req,res);
                if(log){
                    let right = await middleware.checkAdmin(req,res);
                    if(right){
                        next();
                    } else {
                        res.status(403).json(checkAndChange(new Error('unauthorized')));
                    }
                } else {
                    res.status(403).json(checkAndChange(new Error('unauthorized')));
                }
            } else {
                res.status(403).json(checkAndChange(new Error('unauthorized')));
            }
        }
    }
}

module.exports = middleware;