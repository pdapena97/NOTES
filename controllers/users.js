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
            throw generateError(`Introduce un email válido y contraseña, por favor. Error al enviar los datos: ${validation.error.message}`, 401);
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



// PROBLEMA AQUI
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


const getMeController = async (req, res, next) => {
    try {
      const user = await getUserById(req.userId, false);
  
      res.send({
        status: 'ok',
        data: user,
      });
    } catch (error) {
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
            throw generateError(`Introduce your email and password: ${validation.error.message}`, 401);
        }
        
        const user = await getUserByEmail(email);

        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            throw generateError('Wrong Password', 401);
        }

        const payload = {id: user.id};

        const token = jwt.sign(payload, process.env.SECRET, {
            expiresIn: '30d',
        });

        res.send({
            status: 'ok',
            message: 'Esta es tu clave de acceso y tu ID de usuario',
            token: token,
            user_id: user.id
        });

    } catch(error) {
        next(error);
    }    
};



module.exports = {
    newUserController,
    getUserController,
    loginController,
    getMeController,
};