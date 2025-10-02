import pool from '../config/db.js';

export const getPublicProfessionals = async (req, res) => {
    const { specialty } = req.query; 

    try {
        let query = `
            SELECT 
                u.id, 
                CONCAT_WS(' ', u.prefix, u.fullName) as fullName, 
                u.profileImageUrl, 
                p.specialty, 
                p.description,
                p.matriculaProfesional
            FROM Users u
            JOIN Professionals p ON u.id = p.userId
            WHERE u.isActive = TRUE AND u.role = 'PROFESSIONAL'
        `;
        const params = [];

        if (specialty) {
            query += ` AND p.specialty = ?`;
            params.push(specialty);
        }

        const [professionals] = await pool.query(query, params);

        res.json(professionals);
    } catch (error) {
        console.error("Error en getPublicProfessionals:", error);
        res.status(500).json({ message: "Error del servidor al obtener la lista de profesionales." });
    }
};

export const getProfessionalLocations = async (req, res) => {
    const { professionalId } = req.params;
    if (!professionalId) {
        return res.status(400).json({ message: 'ID del profesional es requerido.' });
    }
    try {
        const [locations] = await pool.query(
            'SELECT id, type, name, address, department, city FROM PracticeLocations WHERE professionalUserId = ? AND isActive = TRUE',
            [professionalId]
        );
        res.json(locations);
    } catch (error) {
        console.error("Error en getProfessionalLocations:", error);
        res.status(500).json({ message: 'Error del servidor al obtener los consultorios.' });
    }
};