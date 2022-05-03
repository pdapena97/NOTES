const { generateError, createPathIfNotExists } = require("../helpers");
const { createNote, getUserNotes, getNoteById, deleteNoteById, getNotesList, editNoteById, editCategory, editNotePrivacy } = require("../db/notes");
const path = require('path');
const sharp = require('sharp');
const {nanoid} = require('nanoid');
const Joi = require('@hapi/joi');
const jwt = require('jsonwebtoken');



// Controlador para ver todas las notas creadas por un usuario en concreto, a través de su id.
// Necesita identificarse como su creador.
const getNotesController = async (req, res, next) => {
    try {
        const { id } = req.params;
        const notes = await getUserNotes(id);
        
        if (req.userId !== Number(req.params.id)) {
            
            throw generateError ('Estás intentando ver notas que no son tuyas', 401);
        }

        if (notes.length === 0) {
            throw generateError ('Aún no has creado ninguna nota', 404);
            }

        else {
        res.send({
            status: 'ok',
            message: `Has creado ${notes.length} notas:`,
            data: notes,
        })}

    } catch(error) {
        next(error);
    }
};


// Controlador para la creación de una nueva nota.
// Título, texto, categoría y privacidad son parámetros obligatorios. Privacidad solo admite 'yes' o 'no'.
// Opcionalmente, el usuario puede asociar una única imagen a su nota, en formato jpg.
const newNoteController = async (req, res, next) => {

    try {
        const {text , title, category, public} = req.body;   
        
        const schema = Joi.object().keys({
            text: Joi.string().required(),
            title: Joi.string().required(),
            category: Joi.string().required(),   
            public: Joi.string().valid('yes', 'no').required(),  
            image: Joi.optional(),  
        });

        const validation = schema.validate(req.body);

        if (validation.error) {
            throw generateError (`Obligatoriamente, la nota debe contener: texto ('text'), título ('title'), y categoría ('category'). De manera opcional, puedes añadir una imagen ('image'), en formato jpg. Por último, indica si quieres que tu nota sea pública o privada : yes / no . Error al enviar datos:${validation.error.message}`, 401);
            }
          
        let imageFileName;

        if (req.files && req.files.image) {   

            let numberOfImages = Object.keys(req.files).length
            
            if (numberOfImages > 1) {
                throw generateError ('Solo puedes asociar una imagen a la nota', 401);         
            }
    
            const uploadsDir = path.join(__dirname, '../uploads');

            await createPathIfNotExists(uploadsDir);

            const image = sharp(req.files.image.data);  
            image.resize(1000);

            imageFileName = `${nanoid(24)}.jpg`;
            await image.toFile(path.join(uploadsDir, imageFileName));
        }


        const id = await createNote(req.userId, text, imageFileName, title, category, public);
    
        res.send({
            status: 'ok',
            message: `Nota con id: ${id}' creada correctamente`,
        });

    } catch(error) {
        next(error);
    }
};


// Controlador para recibir una nota en concreto. 
// Si la nota es pública, cualquier usuario podrá verla, esté registrado o no.
// Si es privada, el usuario tendrá que identificarse como el creador para tener acceso a ella.
const getSingleNoteController = async (req, res, next) => {
    try {

        const { id } = req.params; 
        const note = await getNoteById(id);
        
    
        // Caso nota publica. No pregunta nada. El problema es que el authUser actua siempre.
        if (note.public === "yes") {  
            res.send({
                status: 'ok',
                data: note,
            })}
        
        // Caso nota privada. Tiene que hacer authUser.
        if (note.public === "no") {
            
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

            if (req.userId !== note.user_id) {
                throw generateError ('Esta nota es privada: estás intentando ver una nota que no es tuya. Solo podrás verla si eres el creador o si se actualiza a pública', 401);
            }

            res.send({
                status: 'ok',
                data: note,
            })}

    } catch(error) {
        next(error);
    }
};



// Controlador para borrar una nota.
// EL usuario tiene que identificarse como el creador si desea borrarla.
const deleteNoteController = async (req, res, next) => {

    try {

        const { id } = req.params;  

        const note = await getNoteById(id);
    
        if (req.userId !== note.user_id) {
            
            throw generateError ('Estás intentando borrar una nota que no es tuya', 401);
        }
        
        await deleteNoteById(id);

        res.send({
            status: 'ok',
            message: `La nota con id: ${id} fue borrada`,
        });

    } catch(error) {
        next(error);
    }
};


// Devuelve los títulos de las notas creada por un usuario en concreto.
// De nuevo, es necesario que el usuario se identifique como su creador, a través del Token.
const getNotesListController = async (req, res, next) => {
    try {
        const { id } = req.params;  
        const list = await getNotesList(id);  
        
        if (req.userId !== Number(req.params.id)) { 
           
            throw generateError ('Estás intentando ver títulos de notas que no son tuyas', 401);
        }

        if (list.length === 0) {
            throw generateError ('No podemos enviar los títulos, aún no has creado ninguna nota', 404);
            }

        else {
        res.send({
            status: 'ok',
            message: `Has creado ${list.length} notas, sus títulos son:`,
            data: list.flatMap(Object.values)
        })}

    } catch(error) {
        next(error);
    }
};    



// Controlador para editar notas. Aquí se puede editar texto, título e incluso imagen, si el usuario quiere asociar una o cambiar la existente.
// Identificación necesaria.
const editNoteController = async (req, res, next) => {

    try {

        let { text, title, category } = req.body;
        const { id } = req.params; 

        //Joi
        const schema = Joi.object().keys({
            text: Joi.string(),
            title: Joi.string(),        
        });

        const validation = schema.validate(req.body);

        if (validation.error) {
            throw generateError (`Aquí puedes editar tu texto, título, e imagen. Para modificar las categorías y privacidad de la nota, ve a Edit Note Categories y Note Privacy Control. Error al enviar datos:${validation.error.message}`, 401);
            }        

        const note = await getNoteById(id);
        
        
    
        if (req.userId !== note.user_id) {
            throw generateError ('Estás intentando editar una nota que no es tuya', 401);
        }
        
        // Por si el usuario decide añadir una imagen o cambiarla por otra.
        let imageFileName;

        if (req.files && req.files.image) {   
            
            let numberOfImages = Object.keys(req.files).length
            
            if (numberOfImages > 1) {
                throw generateError ('Solo puedes asociar una imagen a la nota', 401);         
            }

            const uploadsDir = path.join(__dirname, '../uploads');

            await createPathIfNotExists(uploadsDir);

            const image = sharp(req.files.image.data);  
            image.resize(1000);

            imageFileName = `${nanoid(24)}.jpg`;
            await image.toFile(path.join(uploadsDir, imageFileName));
        }    

        const keepText = note.text
        const keepCategory = note.category
        const keepTitle = note.title
        const keepImage = note.image
        

        //Por si el usuario solo decide editar una parte de la nota, no la nota entera.
        text = typeof text !== 'undefined' ? text : keepText ;
        title = typeof title !== 'undefined' ? title : keepTitle ;
        category = typeof category !== 'undefined' ? category : keepCategory;
        imageFileName = typeof imageFileName !== 'undefined' ? imageFileName : keepImage;    

        await editNoteById(id, text, title, imageFileName, category);  

        res.send({
            status: 'ok',
            message: `Tu nota, de id:${id}, ha sido actualizada:`, 
            data: await getNoteById(id),
        });

    } catch(error) {
        next(error);
    }
};



// Controlador de la privacidad de la nota.
// El usuario, trás identificarse como el creador, accede a la privacidad de la nota. 
// En el caso de que decida hacerla pública (public = yes), esta nota podrá ser vista por todo el mundo.
 const notePrivacyController = async (req, res, next) => {
    try {

        const { public } = req.body;
        const { id } = req.params; 

        //Joi
        const schema = Joi.object().keys({
            public: Joi.string().valid('yes', 'no').required()        
        });

        const validation = schema.validate(req.body);

        if (validation.error) {
            throw generateError (`Aquí puedes editar tu privacidad. Selecciona si quieres que tu nota sea pública (yes) o privada (no). Error al enviar datos:${validation.error.message}`, 401);
            }   
        
        const note = await getNoteById(id);
        
    
        if (req.userId !== note.user_id) {
            throw generateError ('Estás intentando editar la privacidad de una nota que no es tuya', 401);
        }


        await editNotePrivacy(id, public);

        res.send({
            status: 'ok',
            message: `La privacidad de tu nota (id:${id}), ha sido actualizada:`, 
            data: await getNoteById(id),
        });

    } catch(error) {
        next(error);
    }
};
        

// Controlador para la edición de categorías, identificación de usuario necesaria.
const categoryController = async (req, res, next) => {
    try {

        const { id } = req.params; 
        const {category} = req.body;
        
        const schema = Joi.object().keys({
            category: Joi.string().required()        
        });

        const validation = schema.validate(req.body);


        if (validation.error) {
            throw generateError (`Aquí solo puedes editar las categorías de la nota. Error al enviar datos:${validation.error.message}`, 401);
            }
          
        
        const note = await getNoteById(id);
        
        if (req.userId !== note.user_id) {
           
            throw generateError ('Estás intentando añadir, editar o borrar categorías a una nota que no es tuya', 401);
        }

        if (req.method === "POST") {
            await editCategory(id, category);
            res.send({
                status: 'ok',
                message: `Has actualizado las categorías de la nota ${id}`,
                data: await getNoteById(id) })}
        
    } catch(error) {
        next(error);
    }
};




module.exports = {
    getNotesController,
    newNoteController,
    getSingleNoteController,
    deleteNoteController,
    getNotesListController,
    editNoteController,
    categoryController,
    notePrivacyController
};