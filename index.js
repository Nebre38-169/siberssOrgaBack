// Import des packages externes
const express = require('express');
const environementVariable = require('dotenv').config({path : __dirname+'/.env'});
const morgan = require('morgan');
const catMe = require('cat-me');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('promise-mysql2');

// Import des classes et fonction interne
const Logs = require('./assets/Logs');
const { Boquette } = require('./assets/databaseInteraction/boquette/boquette');
const { Rotance } = require('./assets/databaseInteraction/boquette/rotance');
const { Channel } = require('./assets/databaseInteraction/channel/channel');
const { Posts } = require('./assets/databaseInteraction/channel/posts');
const { Connexion } = require('./assets/databaseInteraction/other/connexion');
const { Auth } = require('./assets/databaseInteraction/other/auth');

const database = require('./database-structure.json');


// Begining of code : 
const app = express();

const env = process.env.NODE_ENV || 'developement';
const port = process.env.PORT || 3000;
const databaseHost = process.env.DB_HOST || 'localhost';

// Création de la connexion avec la base de donnée 
var pool = mysql.createPool({
    host : databaseHost,
    user : process.env.DB_USER,
    password : process.env.DB_PASSWORD,
    database : process.env.DB_DATABASE
})

pool.query(`SELECT * FROM ${database.boquette.name} LIMIT 5`)
.then(([rows,fields])=>{
    if(rows.length>0){
        Logs.info(`Connected to the database at ${databaseHost}`);
    } else {
        Logs.info(`Unable to connect to database at ${databaseHost}....API stoping`);
        process.exit();
    }
})
.catch(err =>{
    Logs.error('index.testConnexion',err);
    throw err;
})

// Création des instances de classes pour intéragir avec la base de données : 

var boquetteOBJ = new Boquette(pool);
var rotanceOBJ = new Rotance(pool,boquetteOBJ);

var channelOBJ = new Channel(pool);
var postsOBJ = new Posts(pool,boquetteOBJ,channelOBJ);

var connexionOBJ = new Connexion(pool,boquetteOBJ);
var authOBJ = new Auth(connexionOBJ,boquetteOBJ);



app.get('/',(req,res)=>{
    res.json('OK');
})

app.listen(port,()=>{
    console.log(catMe('nyan'));
    Logs.info(`Server running on port ${port}`);
})

