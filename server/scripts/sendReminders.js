import dotenv from 'dotenv';
dotenv.config({ path: '../.env' }); // Asegúrate de que la ruta al .env sea correcta desde la carpeta scripts

import pool from '../config/db.js';
import { DateTime } from 'luxon';
import { sendAppointmentReminderEmail } from '../utils/emailService.js';

const sendReminders = async () => {
    console.log('Iniciando tarea de envío de recordatorios...');
    const connection = await pool.getConnection();

    try {
        // Buscamos turnos para mañana. Usamos la zona horaria de Argentina.
        const tomorrow = DateTime.now().setZone('America/Argentina/Buenos_Aires').plus({ days: 1 });
        const startOfTomorrow = tomorrow.startOf('day').toUTC().toFormat('yyyy-MM-dd HH:mm:ss');
        const endOfTomorrow = tomorrow.endOf('day').toUTC().toFormat('yyyy-MM-dd HH:mm:ss');

        const [appointments] = await connection.query(
            `SELECT 
                a.dateTime,
                p.email as patientEmail,
                p.fullName as patientName,
                CONCAT_WS(' ', u.prefix, u.fullName) as professionalName,
                l.name as locationName,
                l.address as locationAddress,
                l.city as locationCity
             FROM Appointments a
             JOIN Patients p ON a.patientId = p.id
             JOIN Users u ON a.professionalUserId = u.id
             JOIN PracticeLocations l ON a.locationId = l.id
             WHERE a.dateTime BETWEEN ? AND ? AND a.status = 'SCHEDULED'`, // Solo recordamos turnos programados
            [startOfTomorrow, endOfTomorrow]
        );

        if (appointments.length === 0) {
            console.log('No hay turnos para mañana. Tarea finalizada.');
            return;
        }

        console.log(`Se encontraron ${appointments.length} turnos para enviar recordatorios.`);

        for (const appt of appointments) {
            if (appt.patientEmail) {
                const location = {
                    name: appt.locationName,
                    address: appt.locationAddress,
                    city: appt.locationCity
                };
                
                // La fecha/hora de la BD está en UTC, la convertimos a JSDate para el servicio de email
                const appointmentDateTime = DateTime.fromISO(appt.dateTime, { zone: 'utc' }).toJSDate();

                await sendAppointmentReminderEmail(
                    appt.patientEmail,
                    appt.patientName,
                    appt.professionalName,
                    appointmentDateTime,
                    location
                );
            }
        }
        console.log('Tarea de envío de recordatorios finalizada exitosamente.');

    } catch (error) {
        console.error('Ocurrió un error durante el envío de recordatorios:', error);
    } finally {
        if (connection) connection.release();
        await pool.end(); // Cerramos el pool de conexiones al finalizar el script
    }
};

sendReminders();