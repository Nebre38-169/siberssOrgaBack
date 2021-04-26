const Logs = require('../../logs');

const passportJWT  = require('passport-jwt');
const jwt = require('jsonwebtoken');

const { Connexion } = require('./connexion');
const { Boquette } = require('../boquette/boquette');
//const { mailing } = require('./mailing');
//const { MailToken } = require('./token');

exports.Auth = class {

    /**
     * Create an object to handle the login/logout method and every action related to authentification
     * @param {Connexion} connection 
     * @param {Boquette} boquette 
     * @param {mailing} mailing
     * @param {MailToken} token
     */
    constructor(connection, boquette){
        this.connexionOBJ = connection;
        this.userOBJ = boquette;
        this.jwtOptions = {};
        this.jwtOptions.jwtFromRequest =  passportJWT.ExtractJwt.fromAuthHeaderAsBearerToken();
        this.jwtOptions.secretOrKey = process.env.SECRET;
    }


    /**
     * Create a token depending on the information provided in the user object. It must containt the email, first and last name,
     * as well as the budget and the creation/update date.
     * @param {any} user
     * @returns {string} 
     */
    getTokenStr(user){
        let userProfile = {
            email : user.email,
            firstName : user.firstName,
            lastName : user.firsName,
            phone : user.phone,
            approuved : user.approuved,
            credit : user.credit,
            promo : user.promo,
            role : user.role,
            room : user.room,
            lastConnexionDate : user.lastConnexionDate,
            creationDate : user.creationDate,
            updateDate : user.updateDate
        }
        return jwt.sign(userProfile,this.jwtOptions.secretOrKey);
    }

    /**
     * Add an entry in the connexion table by using the userId as well as the token.
     * @param {number} userId 
     * @param {string} token 
     */
    createConnexion(userId,token){
        return new Promise(next =>{
            this.connexionOBJ.createNew({
                user : userId,
                token : token
            })
            .then(res =>{
                if(res instanceof Error){
                    next(res);
                } else {
                    Logs.info(`Connexion registered for user ${userId}`);
                    next(true);
                }
            })
        })
    }

    checkPasswordWithEmail(email,password){
        return new Promise(next =>{
            this.userOBJ.getByKey(email,'password')
            .then(res =>{
                if(res instanceof Error){
                    Logs.warning(`No user matching email ${email}`);
                    next(new Error(`No user matching email ${email}`));
                } else {
                    if(password===res.password){
                        Logs.info(`The password for email ${email} is matching`)
                        next(true);
                    } else {
                        Logs.warning(`The password for email ${email} is not matching`);
                        next(new Error(`The password for email ${email} is not matching`));
                    }
                }
            })
            .catch(err =>{
                Logs.error('auth.checkPasswordWithEmail',err);
                next(new Error('internal error'));
            })
        })
    }

    checkPasswordWithId(id,password){
        return new Promise(next =>{
            this.userOBJ.getById(id,'password')
            .then(res =>{
                if(res instanceof Error){
                    Logs.warning(`No user matching id ${id}`);
                    next(new Error(`No user matching id ${id}`));
                } else {
                    if(password===res.password){
                        Logs.info(`The password for id ${id} is matching`)
                        next(true);
                    } else {
                        Logs.warning(`The password for id ${id} is not matching`);
                        next(new Error(`The password for id ${id} is not matching`));
                    }
                }
            })
            .catch(err =>{
                Logs.error('auth.checkPasswordwithId');
                next(new Error('internal error'));
            })
        })
    }

    /**
     * Check if the password matchs the given email. 
     * If so, it will create a connexion and return the user profile as well as the connexion token to authentificate the user.
     * If the password does not match or that the given email is not in the table, it will raise an error.
     * @param {string} email 
     * @param {string} password 
     */
    login(email,password){
        return new Promise(next =>{
            this.checkPasswordWithEmail(email,password)
            .then(v =>{
                if(v instanceof Error){
                    next(v);
                } else {
                    this.userOBJ.getByKey(email)
                    .then(res =>{
                        let user = res;
                        //2 : Get a token
                        let token = this.getTokenStr(user);
                        //3 : Create the connexion in database
                        this.createConnexion(user.id,token)
                        .then(val =>{
                            if(val instanceof Error){
                                next(val);
                            } else {
                                //4 : Return the profile and the token
                                Logs.info(`Successful connexion for user ${email}`);
                                next({user,token});
                            }
                        })
                        .catch(err =>{
                            Logs.error('auth.login',err);
                            next(new Error('internal error'));
                        })
                    })
                    .catch(err =>{
                        Logs.error('auth.login',err);
                        next(new Error('internal error'));
                    })
                }
            })
            .catch(err =>{
                Logs.error('auth.login',err);
                next(new Error('internal error'));
            })
        })
    }
                        

    //TODO : test the method
    /**
     * Delete the token from the connexion table to disable the user from authentifing
     * @param {string} token 
     */
    logout(idUser){
        return new Promise(next =>{
            this.connexionOBJ.getByDependance(idUser,'user')
            .then(val =>{
                if(val instanceof Error){
                    Logs.warning(`Succesfuly loged out the user. But the token was not found`);
                    next(true);
                }else {
                    if(val[0]!=undefined){
                        this.connexionOBJ.delete(val[0].id)
                        .then(res =>{
                            Logs.info(`Succesfuly loged out the user ${val[0].user}`);
                            next(true);
                        })
                    } else {
                        Logs.warning(`No connected user found with id ${idUser}`);
                        next(true);
                    }
                }
            })
        })
    }


    /**
     * Create a user profile
     * @param {any} values 
     */
    signIn(values){
        return new Promise(next =>{
            this.userOBJ.createNew(values)
            .then(res =>{
                if(res instanceof Error){
                    next(res);
                } else {
                    //TODO : add login function
                    Logs.info(`Created a user profile for user ${values['name']}`);
                    next(res);
                }
            })
        })
    }

    /**
     * Return if the time between the two date is less or greater than the timeStep in the config file
     * @param {Date} date1 
     * @param {Date} date2
     * @return {boolean}
     */
    evaluateDelay(date1,date2,delayInMinute=60){
        let time1 = date1.getTime();
        let time2 = date2.getTime();
        let timeStep = delayInMinute*60*100;
        let delay;
        if(time1>time2){
            delay = time1-time2;
        } else {
            delay = time2-time1;
        }
        return delay<timeStep;
    }

    //TODO : add the email to verification could be a good idea, to avoid having multiple token used for different user
    /**
     * Check if the connexion is still good or if the token is expired and if it exist
     * @param {string} token
     * @return {Promise<boolean>}
     */
    checkToken(token,email){
        return new Promise(next =>{
            this.connexionOBJ.getByKey(token)
            .then(val =>{
                if(val instanceof Error){
                    Logs.warning(`The connexion was not found`);
                    next(false);
                } else {
                    this.userOBJ.getById(val.user,'email')
                    .then(res =>{
                        if(res instanceof Error){
                            this.connexionOBJ.delete(val.id);
                            Logs.warning(`No user found with the corresponding connexion`);
                            next(false);
                        } else {
                            if(res.email===email){
                                let tokenDate = new Date(val.updateDate);
                                let currentDate = new Date();
                                if(this.evaluateDelay(tokenDate,currentDate)){
                                    Logs.info(`The connexion was found and up to date`);
                                    next(true);
                                } else {
                                    //TODO : supprimer les connexions expirées
                                    Logs.warning(`The connexion was found but is expired`);
                                    next(false);
                                }
                            } else {
                                this.connexionOBJ.delete(val.id);
                                Logs.warning(`The email ${email} did not match with the user ${val.user}`);
                                next(false);
                            }
                        }
                    })
                    .catch(err =>{
                        Logs.error('auth.checkToken',err);
                        next(new Error('internal error'));
                    })
                }
            })
            .catch(err =>{
                Logs.error('auth.checkToken',err);
                next(new Error('internal error'));
            })
        })
    }

    autoLogin(values){
        // On vérifie l'existance et la validité du token
        return new Promise(next =>{
            this.checkToken(values['token'],values['email'])
            .then(value =>{
                if(value){
                    //Le token est encore valable. On va récupérer le profile utilisateur pour générer un token
                    this.userOBJ.getByKey(values['email'])
                    .then(res =>{
                        if(res instanceof Error){
                            Logs.warning(`User with email ${values['email']} was not found but used a valid token`);
                            next(new Error('Missing information'));
                        } else {
                            //Le profile a été retrouvé, on peut en obtenir un token
                            let newToken = this.getTokenStr(res);
                            this.createConnexion(res.id,newToken)
                            .then(val =>{
                                if(val instanceof Error){
                                    next(val);
                                } else {
                                    Logs.info(`Successful reconnection for user ${values['email']}`);
                                    next({res,newToken});
                                }
                                
                            })
                            .catch(err =>{
                                Logs.error('auth.autoLogin',err);
                                next(new Error('internal error'));
                            })
                        }
                    })
                    .catch(err =>{
                        Logs.error('auth.autoLogin',err);
                        next(new Error('internal error'));
                    })
                } else {
                    next(new Error('Missing information'));
                }
            })
            .catch(err =>{
                Logs.error('auth.autoLogin',err);
                next(new Error('internal error'));
            })
        })
    }
    
    updatePassword(id,newPassword){
        return new Promise(next =>{
            this.userOBJ.update(id,{'password':newPassword})
            .then(res =>{
                if(res instanceof Error){
                    next(res);
                } else {
                    Logs.info(`Succesfully updated the password for user ${id}`);
                    next(res);
                }
            })
            .catch(err =>{
                Logs.error('auth.updatePassword');
                next(new Error('internal error'));
            })
        })
    }
    
}