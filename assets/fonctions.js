// Format de réponse en cas de succès
exports.success = (result) => {
    return {
        status: 'success',
        result: result
    }
}

// Format de réponse en cas d'erreur
exports.error = (message) => {
    return {
        status: 'error',
        result: message
    }
}

// Vérifie si l'objet envoyé est une erreur
exports.isErr = (err) => {
    let res = true;
    if(err == undefined || err instanceof Error || err[0] instanceof Error){
        res = true;
    } else {
        res = false;
    }
    return res
}

// Envoie le bon format de réponse selon l'objet à envoyer
exports.checkAndChange = (obj) => {
    if (this.isErr(obj)) {
        if(obj.length>0){
            console.log(obj)
            let message = [];
            for(err of obj){
                console.log(err);
                message.push(err.message);
            }
            return this.error(message);
        } else {
            return this.error([obj.message])
        }
        
    } else {
        return this.success(obj)
    }
}