const express = require('express');
const { checkAndChange } = require('../../fonctions');
const { Posts } = require('../../databaseInteraction/channel/posts');
const middleware = require('../../middleware');
const router = express.Router();

//TODO : add middleware

var OBJ;

/**
 * 
 * @param {Posts} postsOBJ 
 * @returns 
 */
module.exports = (postsOBJ) =>{
    OBJ = postsOBJ;
    return router;
}

/**
 * Return all entry of the corresponding table
 */
 router.get('/',async (req,res)=>{
    let result = await OBJ.get();
    res.json(checkAndChange(result));
})

/**
 * Return one entry with the corresponding id
 */
router.get('/id/:id',async(req,res)=>{
    let result = await OBJ.getById(req.params.id);
    res.json(checkAndChange(result));
})

/**
 * Return one entry with the corresponding key
 */
router.get('/key/:key',async(req,res)=>{
    let result = await OBJ.getByKey(req.params.key);
    res.json(checkAndChange(result));
})

router.get('/dependance/:field/:id',async(req,res)=>{
    let result = await OBJ.getByDependance(req.params.id,req.params.field);
    res.json(checkAndChange(result))
})

router.get('/last/:channel',async(req,res)=>{
    let result = await OBJ.get('*',{ field : 'channel', value:req.params.channel},{ ordre : { champs:'creationDate',asc : false }, limit : 1 });
    res.json(checkAndChange(result));
})

/**
 * Return the count of all entry in the table
 */
router.get('/count',async(req,res)=>{
    let result = await OBJ.getCount();
    res.json(checkAndChange(result));
})

router.post('',middleware.login,async(req,res)=>{
    let result;
    console.log(req.body);
    if(OBJ.checkFields(req.body)){
        result = await OBJ.createNew(req.body);
    } else {
        result = new Error('Missing info');
    }
    res.json(checkAndChange(result));
})

/**
 * Update an entry if all field are located
 */
router.put('/:id',middleware.login,async (req,res)=>{
    let result;
    if(OBJ.checkFields(req.body)){
        result = await OBJ.update(req.params.id,req.body);
    } else {
        result = new Error('Missing info');
    }
    res.json(checkAndChange(result));
})

/**
 * Delete an entry with the corresponding id
 */
 router.delete('/:id',middleware.login,async (req,res)=>{
    let result = await OBJ.delete(req.params.id);
    res.json(checkAndChange(result));
})
