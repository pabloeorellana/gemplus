import pool from '../config/db.js';

export const getSpecialties = async (req, res) => {
    try {
        const [specialties] = await pool.query('SELECT * FROM Specialties ORDER BY name ASC');
        res.json(specialties);
    } catch (error) {
        res.status(500).json({ message: 'Error del servidor al obtener especialidades.' });
    }
};

export const createSpecialty = async (req, res) => {
    const { name, description } = req.body;
    if (!name) {
        return res.status(400).json({ message: 'El nombre es requerido.' });
    }
    try {
        const [result] = await pool.query('INSERT INTO Specialties (name, description) VALUES (?, ?)', [name, description || null]);
        const [newSpecialty] = await pool.query('SELECT * FROM Specialties WHERE id = ?', [result.insertId]);
        res.status(201).json(newSpecialty[0]);
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'La especialidad ya existe.' });
        }
        res.status(500).json({ message: 'Error del servidor al crear la especialidad.' });
    }
};

export const updateSpecialty = async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;
    if (!name) {
        return res.status(400).json({ message: 'El nombre es requerido.' });
    }
    try {
        const [result] = await pool.query('UPDATE Specialties SET name = ?, description = ? WHERE id = ?', [name, description || null, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Especialidad no encontrada.' });
        }
        const [updatedSpecialty] = await pool.query('SELECT * FROM Specialties WHERE id = ?', [id]);
        res.json(updatedSpecialty[0]);
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Ya existe otra especialidad con ese nombre.' });
        }
        res.status(500).json({ message: 'Error del servidor al actualizar la especialidad.' });
    }
};

export const deleteSpecialty = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query('DELETE FROM Specialties WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Especialidad no encontrada.' });
        }
        res.json({ message: 'Especialidad eliminada.' });
    } catch (error) {
        res.status(500).json({ message: 'Error del servidor al eliminar la especialidad.' });
    }
};

export const getPathologies = async (req, res) => {
    try {
        const [pathologies] = await pool.query(`
            SELECT 
                p.*, 
                GROUP_CONCAT(s.id) as specialtyIds,
                GROUP_CONCAT(s.name SEPARATOR ', ') as specialtyNames -- <-- AÑADIDO: Obtener los nombres de las especialidades
            FROM Pathologies p
            LEFT JOIN SpecialtyPathologies sp ON p.id = sp.pathologyId
            LEFT JOIN Specialties s ON sp.specialtyId = s.id
            GROUP BY p.id
            ORDER BY p.name ASC
        `);
        
        const result = pathologies.map(p => ({
            ...p,
            specialtyIds: p.specialtyIds ? p.specialtyIds.split(',').map(Number) : [],
            specialtyNames: p.specialtyNames || '' // <-- AÑADIDO: Asegurar que el campo exista
        }));
        res.json(result);
    } catch (error) {
        console.error("Error en getPathologies:", error);
        res.status(500).json({ message: 'Error del servidor al obtener patologías.' });
    }
};

export const createPathology = async (req, res) => {
    const { name, description, specialtyIds = [] } = req.body;
    if (!name) {
        return res.status(400).json({ message: 'El nombre es requerido.' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [result] = await connection.query('INSERT INTO Pathologies (name, description) VALUES (?, ?)', [name, description || null]);
        const newPathologyId = result.insertId;

        if (specialtyIds && specialtyIds.length > 0) {
            const specialtyLinks = specialtyIds.map(specialtyId => [specialtyId, newPathologyId]);
            await connection.query('INSERT INTO SpecialtyPathologies (specialtyId, pathologyId) VALUES ?', [specialtyLinks]);
        }

        await connection.commit();
        
        const [newPathology] = await connection.query('SELECT * FROM Pathologies WHERE id = ?', [newPathologyId]);
        res.status(201).json(newPathology[0]);

    } catch (error) {
        await connection.rollback();
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'La patología ya existe.' });
        }
        res.status(500).json({ message: 'Error del servidor al crear la patología.' });
    } finally {
        connection.release();
    }
};

export const updatePathology = async (req, res) => {
    const { id } = req.params;
    const { name, description, specialtyIds = [] } = req.body;
    if (!name) {
        return res.status(400).json({ message: 'El nombre es requerido.' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [result] = await connection.query('UPDATE Pathologies SET name = ?, description = ? WHERE id = ?', [name, description || null, id]);
        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Patología no encontrada.' });
        }

        // Actualizar las asociaciones
        await connection.query('DELETE FROM SpecialtyPathologies WHERE pathologyId = ?', [id]);
        if (specialtyIds && specialtyIds.length > 0) {
            const specialtyLinks = specialtyIds.map(specialtyId => [specialtyId, id]);
            await connection.query('INSERT INTO SpecialtyPathologies (specialtyId, pathologyId) VALUES ?', [specialtyLinks]);
        }

        await connection.commit();

        const [updatedPathology] = await connection.query('SELECT * FROM Pathologies WHERE id = ?', [id]);
        res.json(updatedPathology[0]);

    } catch (error) {
        await connection.rollback();
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Ya existe otra patología con ese nombre.' });
        }
        res.status(500).json({ message: 'Error del servidor al actualizar la patología.' });
    } finally {
        connection.release();
    }
};

export const deletePathology = async (req, res) => {
    // Esta función no necesita cambios, el ON DELETE CASCADE se encarga de las asociaciones
    const { id } = req.params;
    try {
        const [result] = await pool.query('DELETE FROM Pathologies WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Patología no encontrada.' });
        }
        res.json({ message: 'Patología eliminada.' });
    } catch (error) {
        res.status(500).json({ message: 'Error del servidor al eliminar la patología.' });
    }
};


// --- NUEVA FUNCIÓN PARA FILTRAR PATOLOGÍAS POR ESPECIALIDAD ---
export const getPathologiesBySpecialty = async (req, res) => {
    const { userId } = req.user;
    try {
        // Primero, obtenemos la especialidad del profesional logueado
        const [profData] = await pool.query('SELECT specialty FROM Professionals WHERE userId = ?', [userId]);
        if (profData.length === 0) {
            return res.json([]); // Si no tiene especialidad, devuelve un array vacío
        }
        const specialtyName = profData[0].specialty;

        // Luego, obtenemos las patologías asociadas a esa especialidad
        const [pathologies] = await pool.query(`
            SELECT p.* 
            FROM Pathologies p
            JOIN SpecialtyPathologies sp ON p.id = sp.pathologyId
            JOIN Specialties s ON sp.specialtyId = s.id
            WHERE s.name = ?
            ORDER BY p.name ASC
        `, [specialtyName]);
        
        res.json(pathologies);
    } catch (error) {
        console.error("Error en getPathologiesBySpecialty:", error);
        res.status(500).json({ message: 'Error del servidor al obtener patologías.' });
    }
};
export const getPrefixes = async (req, res) => {
    try {
        const [prefixes] = await pool.query('SELECT * FROM Prefixes ORDER BY name ASC');
        res.json(prefixes);
    } catch (error) {
        res.status(500).json({ message: 'Error del servidor al obtener prefijos.' });
    }
};

export const createPrefix = async (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ message: 'El nombre es requerido.' });
    }
    try {
        const [result] = await pool.query('INSERT INTO Prefixes (name) VALUES (?)', [name]);
        const [newPrefix] = await pool.query('SELECT * FROM Prefixes WHERE id = ?', [result.insertId]);
        res.status(201).json(newPrefix[0]);
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'El prefijo ya existe.' });
        }
        res.status(500).json({ message: 'Error del servidor al crear el prefijo.' });
    }
};

export const updatePrefix = async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ message: 'El nombre es requerido.' });
    }
    try {
        const [result] = await pool.query('UPDATE Prefixes SET name = ? WHERE id = ?', [name, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Prefijo no encontrado.' });
        }
        const [updatedPrefix] = await pool.query('SELECT * FROM Prefixes WHERE id = ?', [id]);
        res.json(updatedPrefix[0]);
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Ya existe otro prefijo con ese nombre.' });
        }
        res.status(500).json({ message: 'Error del servidor al actualizar el prefijo.' });
    }
};

export const deletePrefix = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query('DELETE FROM Prefixes WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Prefijo no encontrado.' });
        }
        res.json({ message: 'Prefijo eliminado.' });
    } catch (error) {
        res.status(500).json({ message: 'Error del servidor al eliminar el prefijo.' });
    }
};