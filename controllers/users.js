const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {generateError} = require('../helpers');
const {createUser, getUserById, getUserByEmail} = require('../db/users');
const Joi = require('@hapi/joi');



const newUserController = async (req, res, next) => {
    try {
        const {email, password} = req.body;

        const schema = Joi.object().keys({
            email: Joi.string().email().required(),
            password: Joi.required()
        });

        const validation = schema.validate(req.body);

        if (validation.error) {
            res.send({
                status: 'error',
                usuario: 'Introduce un email válido y una contraseña, por favor',
                error_message: validation.error.message
            })
        }

        else { const id = await createUser(email,password);
        console.log (id);

        res.send({
            status: 'ok',
            message: `User created with id: ${id}`,
        })}

    } catch(error) {
        next(error);
    }
};


// De todos modos, esto debería sobrar, no me lo piden ni tiene sentido creo. Eso o añadir privacidad.

const getUserController = async (req, res, next) => {
    try {
        const {id} = req.params;

        const user = await getUserById(id);

        res.send({
            status: 'ok',
            data: user,
        });

    } catch(error) {
        next(error);
    }    
};



const loginController = async (req, res, next) => {
    try {
        const { email, password} = req.body;

        const schema = Joi.object().keys({
            email: Joi.string().email().required(),
            password: Joi.required()
        });

        const validation = schema.validate(req.body);

        if (validation.error) {
            res.send({
                status: 'error',
                user: 'Introduce tu email y contraseña',
                error_message: validation.error.message
            })
        }
        
        const user = await getUserByEmail(email);

        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            throw generateError('La contraseña no coincide', 401);
        }

        const payload = {id: user.id};

        const token = jwt.sign(payload, process.env.SECRET, {
            expiresIn: '30d',
        });

        res.send({
            status: 'ok',
            message: 'Esta es tu clave de acceso:',
            token: token,
        });

    } catch(error) {
        next(error);
    }    
};



module.exports = {
    newUserController,
    getUserController,
    loginController,
};