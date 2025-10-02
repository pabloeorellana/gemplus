import pool from '../config/db.js';

// Obtener todos los consultorios para el profesional logueado
export const getLocations = async (req, res) => {
    const professionalUserId = req.user.userId;
    try {
        const [locations] = await pool.query(
            'SELECT * FROM PracticeLocations WHERE professionalUserId = ? ORDER BY name ASC',
            [professionalUserId]
        );
        res.json(locations);
    } catch (error) {
        console.error('Error en getLocations:', error);
        res.status(500).json({ message: 'Error del servidor al obtener consultorios.' });
    }
};

// Añadir un nuevo consultorio
export const addLocation = async (req, res) => {
    const professionalUserId = req.user.userId;
    const { type, name, address, department, city } = req.body;

    if (!type || !address || !city || (type === 'centro_medico' && !name)) {
        return res.status(400).json({ message: 'Faltan campos requeridos.' });
    }

    const locationName = type === 'particular' ? 'Consultorio Particular' : name;

    try {
        const [result] = await pool.query(
            'INSERT INTO PracticeLocations (professionalUserId, type, name, address, department, city) VALUES (?, ?, ?, ?, ?, ?)',
            [professionalUserId, type, locationName, address, department || null, city]
        );
        const [newLocation] = await pool.query('SELECT * FROM PracticeLocations WHERE id = ?', [result.insertId]);
        res.status(201).json(newLocation[0]);
    } catch (error) {
        console.error('Error en addLocation:', error);
        res.status(500).json({ message: 'Error del servidor al añadir el consultorio.' });
    }
};

// Actualizar un consultorio existente
export const updateLocation = async (req, res) => {
    const { locationId } = req.params;
    const professionalUserId = req.user.userId;
    const { type, name, address, department, city, isActive } = req.body;

    if (!type || !address || !city || (type === 'centro_medico' && !name)) {
        return res.status(400).json({ message: 'Faltan campos requeridos.' });
    }

    const locationName = type === 'particular' ? 'Consultorio Particular' : name;

    try {
        const [result] = await pool.query(
            'UPDATE PracticeLocations SET type = ?, name = ?, address = ?, department = ?, city = ?, isActive = ? WHERE id = ? AND professionalUserId = ?',
            [type, locationName, address, department || null, city, isActive, locationId, professionalUserId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Consultorio no encontrado o no autorizado.' });
        }
        const [updatedLocation] = await pool.query('SELECT * FROM PracticeLocations WHERE id = ?', [locationId]);
        res.json(updatedLocation[0]);
    } catch (error) {
        console.error('Error en updateLocation:', error);
        res.status(500).json({ message: 'Error del servidor al actualizar el consultorio.' });
    }
};

// Eliminar un consultorio
export const deleteLocation = async (req, res) => {
    const { locationId } = req.params;
    const professionalUserId = req.user.userId;
    try {
        const [result] = await pool.query(
            'DELETE FROM PracticeLocations WHERE id = ? AND professionalUserId = ?',
            [locationId, professionalUserId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Consultorio no encontrado o no autorizado.' });
        }
        res.json({ message: 'Consultorio eliminado correctamente.' });
    } catch (error) {
        console.error('Error en deleteLocation:', error);
        res.status(500).json({ message: 'Error del servidor al eliminar el consultorio.' });
    }
};