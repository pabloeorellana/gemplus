// ======================================================
// subscriptionController.js - Versión segura (checkout por plan)
// ======================================================

import pkg from 'mercadopago';
const { MercadoPagoConfig, PreApproval } = pkg;

import pool from '../config/db.js';
import { DateTime } from 'luxon';

// Configuración del cliente Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

// ======================================================
// Obtener estado de suscripción del usuario
// ======================================================
export const getMySubscriptionStatus = async (req, res) => {
  const userId = req.user.userId;
  try {
    const [subscription] = await pool.query(`
      SELECT 
          s.status,
          s.type,
          s.currentPeriodEnd,
          p.name as planName
      FROM Subscriptions s
      JOIN Plans p ON s.planId = p.id
      WHERE s.userId = ? AND s.status IN ('active', 'paused')
      ORDER BY s.createdAt DESC
      LIMIT 1
    `, [userId]);

    if (subscription.length > 0) {
      res.json(subscription[0]);
    } else {
      const [user] = await pool.query('SELECT trialEndsAt FROM Users WHERE id = ?', [userId]);
      if (user.length > 0 && user[0].trialEndsAt && DateTime.fromJSDate(user[0].trialEndsAt) > DateTime.now()) {
        res.json({
          status: 'active',
          type: 'trial',
          currentPeriodEnd: user[0].trialEndsAt,
          planName: 'Prueba Gratuita'
        });
      } else {
        res.status(404).json({ message: 'No se encontró una suscripción activa o periodo de prueba.' });
      }
    }
  } catch (error) {
    console.error("Error en getMySubscriptionStatus:", error);
    res.status(500).json({ message: 'Error del servidor al obtener el estado de la suscripción.' });
  }
};

// ======================================================
// Obtener planes públicos disponibles
// ======================================================
export const getPlans = async (req, res) => {
  try {
    const [plans] = await pool.query(
      'SELECT id, name, price, patientLimit, locationLimit, storageLimitGB, hasEmailFeatures FROM Plans WHERE isPublic = TRUE'
    );
    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los planes.' });
  }
};

// ======================================================
// Crear suscripción → redirección al plan de Mercado Pago
// ======================================================
export const createSubscription = async (req, res) => {
  const { planId } = req.body;
  const userId = req.user.userId;

  try {
    const [plans] = await pool.query(
      'SELECT name, mercadoPagoPlanId FROM Plans WHERE id = ?',
      [planId]
    );

    if (plans.length === 0) {
      return res.status(404).json({ message: 'Plan no encontrado.' });
    }

    const plan = plans[0];

    if (!plan.mercadoPagoPlanId) {
      return res.status(400).json({ message: 'El plan no tiene un ID de Mercado Pago configurado.' });
    }

    // Construir el enlace de checkout dinámicamente
    const initPoint = `https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=${plan.mercadoPagoPlanId}`;

    // Guardar intención (opcional)
    //await pool.query(
    //  `INSERT INTO SubscriptionIntents (userId, planId, createdAt)
    //   VALUES (?, ?, NOW())`,
    //  [userId, planId]
    //);

    res.json({ init_point: initPoint });
  } catch (error) {
    console.error("Error al crear la suscripción en Mercado Pago:", error);
    res.status(500).json({ message: 'Error al procesar la suscripción.' });
  }
};

// ======================================================
// Webhook: recibir notificaciones de Mercado Pago
// ======================================================
export const handleWebhook = async (req, res) => {
  const { type, data } = req.body;

  if (type === 'preapproval') {
    try {
      const preapproval = new PreApproval(client);
      const subscriptionData = await preapproval.get({ id: data.id });

      const { external_reference: userId, preapproval_plan_id: mpPlanId, status } = subscriptionData;

      const [plans] = await pool.query('SELECT id FROM Plans WHERE mercadoPagoPlanId = ?', [mpPlanId]);
      if (plans.length === 0) return res.sendStatus(200);

      const planId = plans[0].id;
      const nextPaymentDate = DateTime.now().plus({ months: 1 }).toSQL();

      await pool.query("UPDATE Subscriptions SET status = 'cancelled' WHERE userId = ? AND status = 'active'", [userId]);

      await pool.query(
        `INSERT INTO Subscriptions (userId, planId, mercadoPagoSubscriptionId, status, type, currentPeriodEnd) 
         VALUES (?, ?, ?, ?, 'mercado_pago', ?)
         ON DUPLICATE KEY UPDATE status = ?, currentPeriodEnd = ?, type = 'mercado_pago', mercadoPagoSubscriptionId = ?`,
        [userId, planId, data.id, 'active', nextPaymentDate, 'active', nextPaymentDate, data.id]
      );

      if (status === 'authorized') {
        await pool.query('UPDATE Users SET isActive = TRUE, trialEndsAt = NULL WHERE id = ?', [userId]);
      }

    } catch (error) {
      console.error('Error procesando webhook de Mercado Pago:', error);
    }
  }

  res.sendStatus(200);
};
