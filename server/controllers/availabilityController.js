import { DateTime } from 'luxon';
import pool from '../config/db.js';

export const getRegularSchedules = async (req, res) => {
    const professionalUserId = req.user.userId;
    try {
        const [schedules] = await pool.query(
            `SELECT pa.id, pa.dayOfWeek, pa.startTime, pa.endTime, pa.slotDurationMinutes, pa.locationId, pl.name as locationName 
             FROM ProfessionalAvailability pa
             JOIN PracticeLocations pl ON pa.locationId = pl.id
             WHERE pa.professionalUserId = ? 
             ORDER BY pa.dayOfWeek, pa.startTime`,
            [professionalUserId]
        );
        res.json(schedules);
    } catch (error) {
        console.error('Error en getRegularSchedules:', error);
        res.status(500).json({ message: 'Error del servidor al obtener horarios regulares' });
    }
};

export const addRegularSchedule = async (req, res) => {
    const professionalUserId = req.user.userId;
    const { dayOfWeek, startTime, endTime, slotDurationMinutes, locationId } = req.body;
    if (dayOfWeek === undefined || !startTime || !endTime || !slotDurationMinutes || !locationId) {
        return res.status(400).json({ message: 'Todos los campos son requeridos: día, hora inicio, hora fin, duración y consultorio.' });
    }
    try {
        const [result] = await pool.query(
            'INSERT INTO ProfessionalAvailability (professionalUserId, dayOfWeek, startTime, endTime, slotDurationMinutes, locationId) VALUES (?, ?, ?, ?, ?, ?)',
            [professionalUserId, dayOfWeek, startTime, endTime, slotDurationMinutes, locationId]
        );
        const newScheduleId = result.insertId;
        const [newSchedule] = await pool.query(
            `SELECT pa.*, pl.name as locationName 
             FROM ProfessionalAvailability pa
             JOIN PracticeLocations pl ON pa.locationId = pl.id
             WHERE pa.id = ?`, 
            [newScheduleId]
        );
        res.status(201).json(newSchedule[0]);
    } catch (error) {
        console.error('Error en addRegularSchedule:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Ya existe un horario configurado para ese día, hora y consultorio.' });
        }
        res.status(500).json({ message: 'Error del servidor al añadir horario regular' });
    }
};

export const removeRegularSchedule = async (req, res) => {
    const professionalUserId = req.user.userId;
    const { scheduleId } = req.params;
    try {
        const [result] = await pool.query(
            'DELETE FROM ProfessionalAvailability WHERE id = ? AND professionalUserId = ?',
            [scheduleId, professionalUserId]
        );
        if (result.affectedRows > 0) {
            res.json({ message: 'Horario regular eliminado' });
        } else {
            res.status(404).json({ message: 'Horario no encontrado o no autorizado para eliminar' });
        }
    } catch (error) {
        console.error('Error en removeRegularSchedule:', error);
        res.status(500).json({ message: 'Error del servidor al eliminar horario regular' });
    }
};

export const getTimeBlocks = async (req, res) => {
    const professionalUserId = req.user.userId;
    try {
        const [blocks] = await pool.query(
            'SELECT id, startDateTime, endDateTime, reason, isAllDay FROM ProfessionalTimeBlocks WHERE professionalUserId = ? ORDER BY startDateTime',
            [professionalUserId]
        );
        const formattedBlocks = blocks.map(block => ({
            ...block,
            start: block.startDateTime,
            end: block.endDateTime,
            title: `Bloqueo: ${block.reason || (block.isAllDay ? 'Día Completo' : '')}`,
            allDay: !!block.isAllDay
        }));
        res.json(formattedBlocks);
    } catch (error) {
        console.error('Error en getTimeBlocks:', error);
        res.status(500).json({ message: 'Error del servidor al obtener bloqueos de tiempo' });
    }
};

export const addTimeBlock = async (req, res) => {
    const professionalUserId = req.user.userId;
    let { startDateTime, endDateTime, reason, isAllDay } = req.body;

    if (!startDateTime) {
        return res.status(400).json({ message: 'Fecha/hora de inicio es requerida.' });
    }
    if (!isAllDay && !endDateTime) {
        return res.status(400).json({ message: 'Fecha/hora de fin es requerida si no es todo el día.' });
    }

    try {
        const parsedStart = new Date(startDateTime);
        const parsedEnd = !isAllDay ? new Date(endDateTime) : null;
        
        let finalStartDate, finalEndDate;
        if (isAllDay) {
            finalStartDate = new Date(Date.UTC(parsedStart.getUTCFullYear(), parsedStart.getUTCMonth(), parsedStart.getUTCDate(), 0, 0, 0));
            finalEndDate = new Date(Date.UTC(parsedStart.getUTCFullYear(), parsedStart.getUTCMonth(), parsedStart.getUTCDate(), 23, 59, 59));
        } else {
            finalStartDate = parsedStart;
            finalEndDate = parsedEnd;
        }

        const [result] = await pool.query(
            'INSERT INTO ProfessionalTimeBlocks (professionalUserId, startDateTime, endDateTime, reason, isAllDay) VALUES (?, ?, ?, ?, ?)',
            [professionalUserId, finalStartDate, finalEndDate, reason || null, !!isAllDay]
        );
        const newBlockId = result.insertId;
        const [newBlock] = await pool.query('SELECT id, startDateTime, endDateTime, reason, isAllDay FROM ProfessionalTimeBlocks WHERE id = ?', [newBlockId]);
        res.status(201).json({
            ...newBlock[0],
            start: newBlock[0].startDateTime,
            end: newBlock[0].endDateTime,
            title: `Bloqueo: ${newBlock[0].reason || (newBlock[0].isAllDay ? 'Día Completo' : '')}`,
            allDay: !!newBlock[0].isAllDay
        });
    } catch (error) {
        console.error('Error en addTimeBlock:', error);
        res.status(500).json({ message: 'Error del servidor al añadir bloqueo de tiempo' });
    }
};

export const removeTimeBlock = async (req, res) => {
    const professionalUserId = req.user.userId;
    const { blockId } = req.params;
    try {
        const [result] = await pool.query(
            'DELETE FROM ProfessionalTimeBlocks WHERE id = ? AND professionalUserId = ?',
            [blockId, professionalUserId]
        );
        if (result.affectedRows > 0) {
            res.json({ message: 'Bloqueo de tiempo eliminado' });
        } else {
            res.status(404).json({ message: 'Bloqueo no encontrado o no autorizado para eliminar' });
        }
    } catch (error) {
        console.error('Error en removeTimeBlock:', error);
        res.status(500).json({ message: 'Error del servidor al eliminar bloqueo de tiempo' });
    }
};

export const getAvailability = async (req, res) => {
    const { date, professionalId, locationId } = req.query;
    if (!date || !professionalId || !locationId) {
        return res.status(400).json({ message: "Se requiere fecha, ID del profesional y ID del consultorio." });
    }

    try {
        const timeZone = 'America/Argentina/Buenos_Aires';
        const requestedDateLuxon = DateTime.fromISO(date, { zone: timeZone });
        const dayOfWeek = requestedDateLuxon.weekday;

        const [schedules] = await pool.query(
            'SELECT startTime, endTime, slotDurationMinutes FROM ProfessionalAvailability WHERE professionalUserId = ? AND dayOfWeek = ? AND locationId = ?',
            [professionalId, dayOfWeek, locationId]
        );

        if (schedules.length === 0) {
            return res.json([]);
        }

        const startOfDayUTC = requestedDateLuxon.startOf('day').toUTC().toISO();
        const endOfDayUTC = requestedDateLuxon.endOf('day').toUTC().toISO();

        // <-- CORRECCIÓN CRÍTICA: Se eliminó el filtro `locationId` de esta consulta.
        // Un profesional no puede estar en dos lugares a la vez. Esta consulta ahora
        // busca CUALQUIER turno del profesional en el rango de tiempo, sin importar el consultorio.
        const [bookedAppointments] = await pool.query(
            `SELECT DATE_FORMAT(dateTime, '%Y-%m-%dT%H:%i:%SZ') as dateTime 
             FROM Appointments 
             WHERE professionalUserId = ? AND status NOT LIKE 'CANCELED%' AND dateTime BETWEEN ? AND ?`,
            [professionalId, startOfDayUTC, endOfDayUTC]
        );
        
        const [timeBlocks] = await pool.query(
            `SELECT DATE_FORMAT(startDateTime, '%Y-%m-%dT%H:%i:%SZ') as startDateTime, 
                    DATE_FORMAT(endDateTime, '%Y-%m-%dT%H:%i:%SZ') as endDateTime 
             FROM ProfessionalTimeBlocks 
             WHERE professionalUserId = ? AND ? BETWEEN DATE(startDateTime) AND DATE(endDateTime)`,
            [professionalId, date]
        );

        const allAvailableSlots = [];
        const nowUTC = DateTime.utc();

        for (const schedule of schedules) {
            let currentSlot = DateTime.fromISO(`${date}T${schedule.startTime}`, { zone: timeZone });
            const scheduleEnd = DateTime.fromISO(`${date}T${schedule.endTime}`, { zone: timeZone });

            while (currentSlot < scheduleEnd) {
                if (currentSlot.toUTC() < nowUTC) {
                    currentSlot = currentSlot.plus({ minutes: schedule.slotDurationMinutes });
                    continue;
                }

                const isBooked = bookedAppointments.some(appt => 
                    DateTime.fromISO(appt.dateTime).toMillis() === currentSlot.toMillis()
                );
                
                const isBlocked = timeBlocks.some(block => 
                    currentSlot.toMillis() >= DateTime.fromISO(block.startDateTime).toMillis() && 
                    currentSlot.toMillis() < DateTime.fromISO(block.endDateTime).toMillis()
                );

                if (!isBooked && !isBlocked) {
                    allAvailableSlots.push(currentSlot.toFormat('HH:mm'));
                }
             
                currentSlot = currentSlot.plus({ minutes: schedule.slotDurationMinutes });
            }
        }
        
        res.json(allAvailableSlots);

    } catch (error) {
        console.error("Error en getAvailability:", error);
        res.status(500).json({ message: "Error del servidor al obtener la disponibilidad." });
    }
};