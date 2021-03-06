const express = require('express');
const { Auth } = require('../../databaseInteraction/other/auth');
const {checkAndChange} = require('../../fonctions');
const middleware = require('../../middleware');
const router = express.Router();
let dbAuth;

/**
 * Manage all auth route 
 * @param {Auth} AuthOBJ
 */
module.exports = (AuthOBJ) =>{
    dbAuth = AuthOBJ;
    return router;
}

router.post('/login',async(req,res)=>{
    const { boquette, password } = req.body;
    let result;
    if(boquette,password){
        result = await dbAuth.login(boquette,password);
    } else {
        result = new Error('Missing information');
    }
    res.json(checkAndChange(result));
})

router.get('/logout/:id',async(req,res)=>{
    let result = await dbAuth.logout(req.params.id);
    res.json(checkAndChange(result));
})

router.post('/signin',middleware.admin,async(req,res)=>{
    let result;
    if(req.body.name && req.body.password &&
        req.body.respo && req.body.role){
            result = await dbAuth.signIn(req.body);
        } else {
            result = new Error('Missing information');
        }
    console.log(result);
    res.json(checkAndChange(result));
})

router.post('/editpassword/:id',middleware.admin,async(req,res)=>{
    let result;
    if(req.body.newPassword){
        result = await dbAuth.updatePassword(req.params.id,req.body.newPassword);
    } else {
        result = new Error('Missing information');
    }
    res.json(checkAndChange(result));
})
