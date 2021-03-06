// Import des packages externes
const express = require('express');
const environementVariable = require('dotenv').config({path : __dirname+'/.env'});
const morgan = require('morgan');
const catMe = require('cat-me');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('promise-mysql2');

// Import des classes et fonction interne
const { checkEnvironement, checkEnvironnemt } = require('./checkEnvVariable');
const Logs = require('./assets/Logs');
const { Boquette } = require('./assets/databaseInteraction/boquette/boquette');
const { Rotance } = require('./assets/databaseInteraction/boquette/rotance');
const { Channel } = require('./assets/databaseInteraction/channel/channel');
const { Posts } = require('./assets/databaseInteraction/channel/posts');
const { Connexion } = require('./assets/databaseInteraction/other/connexion');
const { Auth } = require('./assets/databaseInteraction/other/auth');

const database = require('./database-structure.json');
const middleware = require('./assets/middleware');

const environement = checkEnvironnemt();
if(environement.status){
    let errorMessage = '';
    for(let v of environement.missing){
        errorMessage+=`${v},`;
    }
    errorMessage+=' are missing form the environement variable. Add them if you want the server to start';
    const e = new Error(errorMessage);
    Logs.error('index.checkEnvironement',e);
    throw e;
}


// Begining of code : 
const app = express();

app.use(cors());
app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

const env = process.env.NODE_ENV || 'developement';
const port = process.env.PORT || 3000;
const databaseHost = process.env.DB_HOST || 'localhost';

Logs.info(`App starting in ${env} mode`);

// Création de la connexion avec la base de donnée 
var pool = mysql.createPool({
    host : databaseHost,
    user : process.env.DB_USER,
    password : process.env.DB_PASSWORD,
    database : process.env.DB_SCHEMA,
    port : process.env.DB_PORT || '3306',
    ssl : (process.env.DB_SSL==='true') || false
})

pool.query(`SELECT * FROM ${database.boquette.name} LIMIT 5`)
.then(([rows,fields])=>{
    if(rows){
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
Logs.info('Loaded boquette OBJ')

var channelOBJ = new Channel(pool);
var postsOBJ = new Posts(pool,boquetteOBJ,channelOBJ);
Logs.info('Loaded posts OBJ')

var connexionOBJ = new Connexion(pool,boquetteOBJ);
var authOBJ = new Auth(connexionOBJ,boquetteOBJ);

Logs.info('OBJ all loaded');


const boquetteRoute = require('./assets/route/boquette/boquette-route')(boquetteOBJ);
const rotanceRoute = require('./assets/route/boquette/rotance-route')(rotanceOBJ);
Logs.info('loaded boquette routes');

const channelRoute = require('./assets/route/channel/channel-route')(channelOBJ);
const postsRoute = require('./assets/route/channel/posts-route')(postsOBJ);
Logs.info('loaded channel routes');

const authRoute = require('./assets/route/other/auth-route')(authOBJ);

app.use(middleware.logs);
app.use(middleware.spice);

app.get('/',(req,res)=>{
    res.json('OK');
})

app.use('/boquette',boquetteRoute);
app.use('/rotance',rotanceRoute);

app.use('/channel',channelRoute);
app.use('/posts',postsRoute);

app.use('/auth',authRoute);
Logs.info('All route setted');

app.listen(port,()=>{
    console.log(catMe('nyan'));
    Logs.info(`Server running on port ${port}`);
})

