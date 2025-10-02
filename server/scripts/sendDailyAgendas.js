import dotenv from 'dotenv';
// Asegúrate de que la ruta al archivo .env sea correcta desde la carpeta de scripts
dotenv.config({ path: new URL('../../.env', import.meta.url).pathname });

import pool from '../config/db.js';
import { DateTime } from 'luxon';
import { sendDailyAgendaEmail } from '../utils/emailService.js';

const sendAgendas = async () => {
    console.log(`[${new Date().toISOString()}] Iniciando tarea de envío de agendas diarias...`);
    const connection = await pool.getConnection();

    try {
        // 1. Obtener todos los profesionales que desean recibir el email
        const [professionals] = await connection.query(
            "SELECT id, email, prefix, fullName FROM Users WHERE role = 'PROFESSIONAL' AND isActive = TRUE AND receivesDailyAgenda = TRUE"
        );

        if (professionals.length === 0) {
            console.log('No hay profesionales suscritos a la agenda diaria. Tarea finalizada.');
            return;
        }

        // 2. Para cada profesional, buscar sus turnos de hoy
        for (const prof of professionals) {
            const today = DateTime.now().setZone('America/Argentina/Buenos_Aires');
            const startOfDay = today.startOf('day').toUTC().toFormat('yyyy-MM-dd HH:mm:ss');
            const endOfDay = today.endOf('day').toUTC().toFormat('yyyy-MM-dd HH:mm:ss');

            const [appointments] = await connection.query(
                `SELECT 
                    a.dateTime,
                    p.fullName as patientName,
                    l.name as locationName
                 FROM Appointments a
                 JOIN Patients p ON a.patientId = p.id
                 JOIN PracticeLocations l ON a.locationId = l.id
                 WHERE a.professionalUserId = ? 
                   AND a.dateTime BETWEEN ? AND ? 
                   AND a.status = 'SCHEDULED'
                 ORDER BY a.dateTime ASC`,
                [prof.id, startOfDay, endOfDay]
            );

            if (appointments.length > 0) {
                const fullProfessionalName = [prof.prefix, prof.fullName].filter(Boolean).join(' ');
                await sendDailyAgendaEmail(prof.email, fullProfessionalName, appointments);
                console.log(`Agenda diaria enviada a ${prof.email} con ${appointments.length} turnos.`);
            } else {
                console.log(`No se encontraron turnos para hoy para ${prof.email}. No se envía email.`);
            }
        }

        console.log('Tarea de envío de agendas diarias finalizada exitosamente.');

    } catch (error) {
        console.error('Ocurrió un error durante el envío de agendas:', error);
    } finally {
        if (connection) connection.release();
        // Es importante cerrar el pool para que el script termine y no deje conexiones abiertas
        await pool.end();
        console.log('Pool de conexiones cerrado.');
    }
};

sendAgendas();