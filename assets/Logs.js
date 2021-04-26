const fs = require('fs');
const config = require('../config.json');

module.exports = class Logs {


    /**
     * Convert a date object to a string with the format 'YYYY:MM:DD-HH:MM:SS'
     * @param {Date} date 
     * @returns {string}
     */
    static getDateTimeStr(date){
        return `${this.getDateStr(date)}_${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
    }

    /**
     * Convert a date object to a string with the format 'YYYY:MM:DD'
     * @param {Date} date 
     * @returns {string}
     */
    static getDateStr(date){
        return `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`;
    }

    /**
     * Write the content at the end of a specified file
     * @param {string} file 
     * @param {string} content 
     */
    static fileWrite(file,content){
        fs.appendFile(file,content+`\n`,(err)=>{
            if(err){
                throw err;
            }
        })
    }

    /**
     * Write a line in the log file
     * @param {string} content 
     */
    static logWrite(content){
        let filePath = config.logs.file+`/${this.getDateStr(new Date())}.log`;
        console.log(content);
        this.fileWrite(filePath,content);
    }

    /**
     * Write all usefull information on a coming request.
     * @param {*} req 
     */
    static connexion(req){
        let connexion = `Request from application ${req.headers.origin} on page ${req.headers.referer}. Requesting ${req.client.parser.socket.parser.incoming.url} with method ${req.client.parser.socket.parser.incoming.method} for IP ${req.client.parser.socket._peername.address}`;
        this.info(connexion);
        /* console.log(req.headers.origin);
        console.log(req.headers.referer);
        console.log(req.client.parser.socket._peername.address);
        console.log(req.client.parser.socket.parser.incoming.method);
        console.log(req.client.parser.socket.parser.incoming.url); */
    }

    /**
     * Write an info log
     * @param {string} message 
     */
    static info(message){
        let content = `${this.getDateTimeStr(new Date())}-[INFO]-${message}`;
        this.logWrite(content);
    }

    /**
     * Write a warning log
     * @param {string} message 
     */
    static warning(message){
        let content = `${this.getDateTimeStr(new Date())}-[WARNING]-${message}`;
        this.logWrite(content);
    }

    /**
     * 
     * @param {string} process 
     * @param {Error} err 
     */
    static error(process,err){
        let fileErrorPath = config.logs.file+`/error/${this.getDateStr(new Date())}-[${process}].error`;
        let content = `name : ${err.name}\nmessage : ${err.message}\nstack : ${err.stack}`;
        let message = `${this.getDateTimeStr(new Date())}-[ERROR]-Error during process ${process}, see ${fileErrorPath} for full stack`;
        this.logWrite(message);
        this.fileWrite(fileErrorPath,content);
    }
}