const jwt = require('jsonwebtoken');
const { generateError } = require("../helpers");

const authUser = (req, res, next) =>{
    try {
        const {authorization } = req.headers;
        if (!authorization) {
            throw generateError('Falta la cabecera de Autorización, necesitas estar registrado', 401);
        }

        let token;

        try {
            token = jwt.verify(authorization,process.env.SECRET)
        } catch {
            throw generateError('Token incorrecto', 401);
        }

        req.userId = token.id;

        next();

    } catch (error) {
        next (error);
    }
};

module.exports = {
    authUser,
};