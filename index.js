const express = require('express');
const catMe = require('cat-me');

const app = express();

const env = process.env.NODE_ENV || 'developement';
const port = process.env.PORT || 3000;

app.get('/',(req,res)=>{
    res.json('OK');
})

app.listen(port,()=>{
    console.log(catMe('nyan'));
    console.log(`Server running on port ${port}`);
})

