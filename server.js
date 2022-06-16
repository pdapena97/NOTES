require('dotenv').config();

const express = require ('express');
const morgan = require('morgan');
const fileUpload = require('express-fileupload');

const {
    newUserController,
    getUserController,
    loginController,
    getMeController,
} = require('./controllers/users');

const {
    getNotesController,
    newNoteController,
    getSingleNoteController,
    deleteNoteController,
    getNotesListController,
    editNoteController,
    categoryController,
    notePrivacyController,
    getPublicNotesController,
    getUserPublicNotesController
} = require('./controllers/notes');

const {authUser} = require('./middlewares/auth');

const app = express();
const cors = require('cors');
app.use(cors());

app.use(fileUpload());
app.use(express.json());
app.use(morgan('dev'));
app.use('/uploads', express.static('./uploads'));


// Rutas de usuario
app.post ('/user', newUserController);
app.get('/user/:id', getUserController);
app.post('/login', loginController);
app.get('/user', authUser, getMeController);


// Rutas de notes
app.get('/notes/:id',authUser, getNotesController);      
app.post('/',authUser, newNoteController);  
app.get('/note/:id', getSingleNoteController);   
app.delete('/note/:id',authUser, deleteNoteController); 
app.get('/list/:id',authUser, getNotesListController) 
app.put('/note/:id',authUser, editNoteController);   
app.post('/category/:id', authUser, categoryController);
app.post('/privacy/:id', authUser, notePrivacyController);
app.get('/publicnotes', getPublicNotesController);
app.get('/userpublicnotes/:id', getUserPublicNotesController);

                                                                
    
// Middleware de 404
app.use((req,res) => {
    res.status(404).send({
        status: 'error',
        message: 'Not found',
    });
});

// Middleware de gestión de errores
app.use((error, req, res, next) => {
    //console.error(error);

    res.status(error.httpStatus || 500).send({
        status: 'error',
        message: error.message,
    });
});


// Lanzamos el servidor
app.listen(4000, () => {
    console.log('Servidor funcionando!');
});