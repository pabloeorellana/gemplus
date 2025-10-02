import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/db.js';

export const getAllUsers = async (req, res) => {
    try {
        const [users] = await pool.query(
            'SELECT id, usuario, fullName, email, phone, role, isActive, createdAt, prefix, firstName, lastName FROM Users ORDER BY lastName ASC, firstName ASC'
        );
        res.json(users);
    } catch (error) {
        console.error('Error en getAllUsers:', error);
        res.status(500).json({ message: 'Error del servidor al obtener usuarios.' });
    }
};

export const createUser = async (req, res) => {
    const { usuario, email, password, firstName, lastName, prefix, role, specialty, dni, matriculaProfesional } = req.body;
    if (!usuario || !email || !password || !firstName || !lastName || !role) {
        return res.status(400).json({ message: 'Faltan campos requeridos (usuario, email, password, nombre, apellido, role).' });
    }
    if (role === 'PROFESSIONAL' && !specialty) {
        return res.status(400).json({ message: 'La especialidad es requerida para el rol Profesional.' });
    }
    const fullName = `${lastName}, ${firstName}`;
    const finalPrefix = (prefix === 'Sin prefijo' || !prefix) ? null : prefix;

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();
        const [existing] = await connection.query('SELECT usuario, email FROM Users WHERE usuario = ? OR email = ?', [usuario, email]);
        if (existing.length > 0) {
            await connection.rollback();
            return res.status(400).json({ message: 'El nombre de usuario o el email ya están registrados.' });
        }
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const userId = uuidv4();
        await connection.query(
            'INSERT INTO Users (id, usuario, email, passwordHash, fullName, firstName, lastName, prefix, role, dni) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [userId, usuario, email, passwordHash, fullName, firstName, lastName, finalPrefix, role, dni || null]
        );
        if (role === 'PROFESSIONAL') {
            await connection.query(
                'INSERT INTO Professionals (userId, specialty, matriculaProfesional) VALUES (?, ?, ?)',
                [userId, specialty, matriculaProfesional || null]
            );
        }
        await connection.commit();
        const [newUser] = await connection.query('SELECT id, usuario, fullName, email, role, isActive, createdAt, prefix, dni FROM Users WHERE id = ?', [userId]);
        res.status(201).json(newUser[0]);
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error en createUser (admin):', error);
        res.status(500).json({ message: 'Error del servidor al crear el usuario.' });
    } finally {
        if (connection) connection.release();
    }
};

export const updateUser = async (req, res) => {
    const { id: userId } = req.params;
    const { firstName, lastName, prefix, email, role, isActive, specialty, dni, matriculaProfesional } = req.body;
    if (!firstName || !lastName || !email || !role) {
        return res.status(400).json({ message: 'Nombre, apellido, email y rol son requeridos.' });
    }
    const fullName = `${lastName}, ${firstName}`;
    const finalPrefix = (prefix === 'Sin prefijo' || !prefix) ? null : prefix;

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();
        await connection.query(
            'UPDATE Users SET fullName = ?, firstName = ?, lastName = ?, prefix = ?, email = ?, role = ?, isActive = ?, dni = ? WHERE id = ?',
            [fullName, firstName, lastName, finalPrefix, email, role, isActive, dni || null, userId]
        );
        if (role === 'PROFESSIONAL') {
            const [existingProfile] = await connection.query('SELECT userId FROM Professionals WHERE userId = ?', [userId]);
            if (existingProfile.length > 0) {
                await connection.query(
                    'UPDATE Professionals SET specialty = ?, matriculaProfesional = ? WHERE userId = ?',
                    [specialty || '', matriculaProfesional || null, userId]
                );
            } else {
                await connection.query(
                    'INSERT INTO Professionals (userId, specialty, matriculaProfesional) VALUES (?, ?, ?)',
                    [userId, specialty || '', matriculaProfesional || null]
                );
            }
        }
        await connection.commit();
        res.json({ message: 'Usuario actualizado exitosamente.' });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error en updateUser (admin):', error);
        res.status(500).json({ message: 'Error del servidor al actualizar usuario.' });
    } finally {
        if (connection) connection.release();
    }
};

export const toggleUserStatus = async (req, res) => {
    const { id: userId } = req.params;
    if (req.user.userId === userId) {
        return res.status(400).json({ message: 'No puede desactivar su propia cuenta de administrador.' });
    }
    try {
        const [users] = await pool.query('SELECT isActive FROM Users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }
        const currentStatus = users[0].isActive;
        const newStatus = !currentStatus;
        await pool.query('UPDATE Users SET isActive = ? WHERE id = ?', [newStatus, userId]);
        const action = newStatus ? 'reactivado' : 'desactivado';
        res.json({ message: `Usuario ${action} exitosamente.` });
    } catch (error) {
        console.error('Error en toggleUserStatus (admin):', error);
        res.status(500).json({ message: 'Error del servidor al cambiar el estado del usuario.' });
    }
};

export const getUserById = async (req, res) => {
    const { id: userId } = req.params;
    try {
        const [users] = await pool.query(`
            SELECT u.id, u.usuario, u.fullName, u.firstName, u.lastName, u.prefix, u.email, u.role, u.isActive, u.dni, p.specialty, p.matriculaProfesional
            FROM Users u
            LEFT JOIN Professionals p ON u.id = p.userId
            WHERE u.id = ?
        `, [userId]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }
        res.json(users[0]);
    } catch (error) {
        console.error('Error en getUserById (admin):', error);
        res.status(500).json({ message: 'Error del servidor al obtener el usuario.' });
    }
};

export const resetUserPassword = async (req, res) => {
    const { id: userId } = req.params;
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: 'La nueva contraseña es requerida y debe tener al menos 6 caracteres.' });
    }
    try {
        const [users] = await pool.query('SELECT id FROM Users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);
        await pool.query(
            'UPDATE Users SET passwordHash = ? WHERE id = ?',
            [passwordHash, userId]
        );
        res.json({ message: 'Contraseña restablecida exitosamente.' });
    } catch (error) {
        console.error('Error en resetUserPassword (admin):', error);
        res.status(500).json({ message: 'Error del servidor al restablecer la contraseña.' });
    }
};

export const deletePatientPermanently = async (req, res) => {
    const { id: patientId } = req.params;
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();
        await connection.execute('DELETE FROM ClinicalRecords WHERE patientId = ?', [patientId]);
        await connection.execute('DELETE FROM Appointments WHERE patientId = ?', [patientId]);
        const [patientResult] = await connection.execute('DELETE FROM Patients WHERE id = ?', [patientId]);
        if (patientResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Paciente no encontrado.' });
        }
        await connection.commit();
        res.json({ message: 'Paciente y todos sus datos asociados han sido eliminados permanentemente.' });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error en deletePatientPermanently (admin):', error);
        res.status(500).json({ message: 'Error del servidor al eliminar el paciente.' });
    } finally {
        if (connection) connection.release();
    }
};

export const deleteUserPermanently = async (req, res) => {
    const { id: userId } = req.params;
    if (req.user.userId === userId) {
        return res.status(400).json({ message: 'No puede eliminar su propia cuenta de administrador.' });
    }
    
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();
        await connection.execute('DELETE FROM Professionals WHERE userId = ?', [userId]);
        
        const [userResult] = await connection.execute('DELETE FROM Users WHERE id = ?', [userId]);

        if (userResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        await connection.commit();
        res.json({ message: 'Usuario y todos sus datos asociados han sido eliminados permanentemente.' });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error en deleteUserPermanently (admin):', error);
        res.status(500).json({ message: 'Error del servidor al eliminar el usuario permanentemente.' });
    } finally {
        if (connection) connection.release();
    }
};