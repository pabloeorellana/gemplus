import dotenv from 'dotenv';
dotenv.config({ path: new URL('../../.env', import.meta.url).pathname });

import pool from '../config/db.js';

const checkSubscriptions = async () => {
    console.log(`[${new Date().toISOString()}] Iniciando tarea de verificación de suscripciones...`);
    const connection = await pool.getConnection();

    try {
        // 1. Marcar como expiradas las suscripciones vencidas
        const [expiredResult] = await connection.query(
            "UPDATE Subscriptions SET status = 'expired' WHERE currentPeriodEnd < NOW() AND status = 'active'"
        );
        if (expiredResult.affectedRows > 0) {
            console.log(`${expiredResult.affectedRows} suscripciones marcadas como expiradas.`);
        }

        // 2. Desactivar usuarios cuyo periodo de prueba ha terminado y no tienen una suscripción de pago activa
        const [trialExpiredResult] = await connection.query(
            `UPDATE Users u
             LEFT JOIN Subscriptions s ON u.id = s.userId AND s.status = 'active'
             SET u.isActive = FALSE
             WHERE u.trialEndsAt < NOW() AND s.id IS NULL AND u.isActive = TRUE`
        );
        if (trialExpiredResult.affectedRows > 0) {
            console.log(`${trialExpiredResult.affectedRows} cuentas de prueba desactivadas.`);
        }

        console.log('Tarea de verificación finalizada.');

    } catch (error) {
        console.error('Ocurrió un error durante la verificación de suscripciones:', error);
    } finally {
        if (connection) connection.release();
        await pool.end();
    }
};

checkSubscriptions();