//const { generateError } = require('../helpers');
const { generateError } = require('../helpers');
const { getConnection } = require('./db');



const editNoteById = async (id, text, title, image, category) => {
    let connection;

    try {
        connection = await getConnection();

        const [result] = await connection.query(`
             UPDATE notes SET text =? , image =?, title =?, category=? 
             WHERE id=?
            `,[text, image, title, category, id]);
 
        return result;
    
    } finally {
        if (connection) connection.release();
    }
}



const deleteNoteById = async (id) => {
    let connection;

    try {
        connection = await getConnection();

        await connection.query(`
        DELETE FROM notes WHERE id = ?
        `, [id]);

        return;

    } finally {
        if (connection) connection.release();
    }
};




const getNoteById = async (id) => {
    let connection;

    try {
        connection = await getConnection();

        const [result] = await connection.query(`
        SELECT * FROM notes WHERE id=?
        `, [id]);

        if (result.length === 0) {
            throw generateError (`La nota con id:${id} no existe`, 404);
        }
        
        return result[0]; 
        

    } finally {
        if (connection) connection.release();
    }
};



const getNotesList = async (id) => {
    let connection;

    try {
        connection = await getConnection();

        const [result] = await connection.query(`
        SELECT title FROM notes WHERE user_id=?
        `, [id]);
      
        return result;

    } finally {
        if (connection) connection.release();
    }
};



const getUserNotes = async (id) => {
    let connection;

    try {
        connection = await getConnection();

        const [result] = await connection.query(`
        SELECT * FROM notes WHERE user_id=? ORDER BY created_at DESC
        `, [id]);

        return result;

    } finally {
        if (connection) connection.release();
    }
};




const createNote = async (userId, text, image = "undefined", title, category, public) => {
    let connection;

    try {
        connection = await getConnection();

        const [result] = await connection.query(`
        INSERT INTO notes (user_id, text, image, title, category, public)
        VALUES(?,?,?,?,?,?)
        `, [userId, text, image, title, category, public]);


        return result.insertId;   

    } finally {
        if(connection) connection.release();
    }    
};




const editCategory = async (id, category ) => {
    let connection;

    try {
        connection = await getConnection();

        await connection.query(`
        UPDATE notes
        SET category =?
        WHERE id =?
        `, [category, id]);

        return;   

    } finally {
        if(connection) connection.release();
    }    
};




const editNotePrivacy = async (id, public) => {
    let connection;

    try {
        connection = await getConnection();

        await connection.query(`
        UPDATE notes
        SET public =?
        WHERE id =?
        `, [public, id]);

        return;   

    } finally {
        if(connection) connection.release();
    }    
};    


module.exports = {
    createNote,
    getUserNotes,
    getNoteById,
    deleteNoteById,
    getNotesList,
    editNoteById,
    editCategory,
    editNotePrivacy
};