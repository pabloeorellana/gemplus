import nodemailer from 'nodemailer';
import dotenv from 'dotenv'; 
import crypto from 'crypto';
import { DateTime } from 'luxon';

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT == 465, 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

// <-- Definimos la URL del logo. Usará la variable de entorno si existe, si não, usa una por defecto. -->
const LOGO_URL = process.env.APP_LOGO_URL || 'https://www.gemplus.com.ar/gemplus-logo.png';

export const sendAppointmentConfirmationEmail = async (patientEmail, patientName, professionalName, dateTime, reasonForVisit, location) => {
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD || !process.env.SENDER_EMAIL) {
        console.error('Error: Las variables de entorno para el envío de correos no están configuradas correctamente.');
        return; 
    }

    const dateObj = DateTime.fromJSDate(dateTime).setZone('America/Argentina/Buenos_Aires');
    const formattedDate = dateObj.toFormat('cccc, dd \'de\' LLLL \'de\' yyyy', { locale: 'es' });
    const formattedTime = dateObj.toFormat('HH:mm \'hs.\'');
    const locationInfo = location 
        ? `<p><strong>Lugar:</strong> ${location.name}</p>
           <p><strong>Dirección:</strong> ${location.address}, ${location.city}</p>`
        : '';
        
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e0e0e0; }
            /* <-- MODIFICADO: Color de fondo del header a blanco y borde sutil --> */
            .header { background-color: #ffffff; padding: 20px; text-align: center; border-bottom: 1px solid #e0e0e0; }
            .header img { height: 50px; }
            .content { padding: 30px; text-align: center; color: #2E3A3A; }
            .content-icon { font-size: 48px; color: #028184; }
            h1 { color: #015E5E; margin-top: 20px; margin-bottom: 10px; font-size: 24px; }
            p { line-height: 1.6; color: #5C6B6B; font-size: 16px; }
            .details { background-color: #F9FAFA; padding: 20px; margin: 20px 0; border-radius: 5px; text-align: left; border: 1px solid #e0e0e0; }
            .details p { margin: 10px 0; font-size: 16px; }
            .details strong { color: #2E3A3A; }
            .important-box { background-color: #B3E5FC; padding: 20px; margin-top: 20px; border-radius: 5px; text-align: center; border-left: 5px solid #028184; }
            .important-box h2 { margin: 0 0 10px 0; color: #015E5E; font-size: 18px; }
            .button-container { text-align: center; margin-top: 30px; }
            .button { background-color: #028184; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; }
            .footer { background-color: #015E5E; padding: 20px; text-align: center; color: #ffffff; }
            .footer p { color: #e0e0e0; font-size: 12px; margin: 5px 0; }
            .footer a { color: #ffffff; text-decoration: underline; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="${LOGO_URL}" alt="GEM Plus Logo">
            </div>
            <div class="content">
                <div class="content-icon">&#128197;</div>
                <h1>Tu Turno ha sido Confirmado</h1>
                <p>Estimado/a <strong>${patientName}</strong>,</p>
                <p>Te contactamos para informarte que tu turno con <strong>${professionalName}</strong> ha sido agendado exitosamente. A continuación, encontrarás los detalles.</p>

                <div class="details">
                    <h2 style="text-align: center; color: #015E5E; margin-top:0;">Detalles del Turno</h2>
                    <p><strong>Profesional:</strong> ${professionalName}</p>
                    <p><strong>Fecha:</strong> ${formattedDate}</p>
                    <p><strong>Hora:</strong> ${formattedTime}</p>
                    ${locationInfo}
                    <p><strong>Motivo de la consulta:</strong> ${reasonForVisit || 'No especificado'}</p>
                </div>

                <div class="important-box">
                    <h2>Información Importante</h2>
                    <p style="font-size: 14px; color: #015E5E;">El turno solicitado es un compromiso. Si no puedes asistir, por favor, comunícate con nosotros para cancelarlo y así liberar el horario para otro paciente.</p>
                </div>

                <div class="button-container">
                    <a href="${process.env.FRONTEND_URL}" class="button">Visitar Nuestro Sitio</a>
                </div>
            </div>
            <div class="footer">
                <p>GEM Plus - Gestión de Pacientes y Turnos</p>
                <p>Este es un mensaje automático, por favor no respondas a este correo.</p>
            </div>
        </div>
    </body>
    </html>
    `;

    const mailOptions = {
        from: `"${process.env.SENDER_NAME || 'GEM Plus - Turnos'}" <${process.env.SENDER_EMAIL}>`,
        to: patientEmail,
        subject: `Confirmación de Turno - ${professionalName}`,
        html: htmlContent,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email de confirmación enviado a ${patientEmail}`);
    } catch (error) {
        console.error(`Error al enviar email a ${patientEmail}:`, error);
    }
};

export const sendAppointmentReminderEmail = async (patientEmail, patientName, professionalName, dateTime, location) => {
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD || !process.env.SENDER_EMAIL) {
        return; 
    }

    const dateObj = DateTime.fromJSDate(dateTime).setZone('America/Argentina/Buenos_Aires');
    const formattedDate = dateObj.toFormat('cccc, dd \'de\' LLLL', { locale: 'es' });
    const formattedTime = dateObj.toFormat('HH:mm \'hs.\'');
    const locationInfo = location 
        ? `<p><strong>Lugar:</strong> ${location.name}</p>
           <p><strong>Dirección:</strong> ${location.address}, ${location.city}</p>`
        : '';

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e0e0e0; }
            .header { background-color: #ffffff; padding: 20px; text-align: center; border-bottom: 1px solid #e0e0e0; }
            .header img { height: 50px; }
            .content { padding: 30px; text-align: center; color: #2E3A3A; }
            .content-icon { font-size: 48px; color: #028184; }
            h1 { color: #015E5E; margin-top: 20px; margin-bottom: 10px; font-size: 24px; }
            p { line-height: 1.6; color: #5C6B6B; font-size: 16px; }
            .details { background-color: #F9FAFA; padding: 20px; margin: 20px 0; border-radius: 5px; text-align: left; border: 1px solid #e0e0e0; }
            .details p { margin: 10px 0; font-size: 16px; }
            .details strong { color: #2E3A3A; }
            .important-box { background-color: #FFD580; padding: 20px; margin-top: 20px; border-radius: 5px; text-align: center; border-left: 5px solid #f57c00; }
            .important-box h2 { margin: 0 0 10px 0; color: #e65100; font-size: 18px; }
            .footer { background-color: #015E5E; padding: 20px; text-align: center; color: #ffffff; }
            .footer p { color: #e0e0e0; font-size: 12px; margin: 5px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="${LOGO_URL}" alt="GEM Plus Logo">
            </div>
            <div class="content">
                <div class="content-icon">&#128337;</div>
                <h1>Recordatorio de tu Turno</h1>
                <p>Estimado/a <strong>${patientName}</strong>,</p>
                <p>Te recordamos que tienes un turno programado para <strong>mañana</strong> con <strong>${professionalName}</strong>.</p>

                <div class="details">
                    <h2 style="text-align: center; color: #015E5E; margin-top:0;">Detalles del Turno</h2>
                    <p><strong>Fecha:</strong> Mañana, ${formattedDate}</p>
                    <p><strong>Hora:</strong> ${formattedTime}</p>
                    ${locationInfo}
                </div>

                <div class="important-box">
                    <h2>Aviso Importante</h2>
                    <p style="font-size: 14px; color: #e65100;">Si no puedes asistir, por favor, avísanos lo antes posible para poder ofrecerle el horario a otra persona. ¡Te esperamos!</p>
                </div>
            </div>
            <div class="footer">
                <p>GEM Plus - Gestión de Pacientes y Turnos</p>
                <p>Este es un mensaje automático, por favor no respondas a este correo.</p>
            </div>
        </div>
    </body>
    </html>
    `;

    const mailOptions = {
        from: `"${process.env.SENDER_NAME || 'GEM Plus - Turnos'}" <${process.env.SENDER_EMAIL}>`,
        to: patientEmail,
        subject: `Recordatorio de Turno para Mañana - ${professionalName}`,
        html: htmlContent,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email de recordatorio enviado a ${patientEmail}`);
    } catch (error) {
        console.error(`Error al enviar email de recordatorio a ${patientEmail}:`, error);
    }
};

export const sendPasswordResetEmail = async (userEmail, resetToken) => {
    if (!process.env.EMAIL_HOST || !process.env.SENDER_EMAIL || !process.env.FRONTEND_URL) {
        console.error('Error: Faltan variables de entorno para el reseteo de contraseña.');
        return;
    }

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e0e0e0; }
            .header { background-color: #ffffff; padding: 20px; text-align: center; border-bottom: 1px solid #e0e0e0; }
            .header img { height: 50px; }
            .content { padding: 30px; text-align: center; color: #2E3A3A; }
            .content-icon { font-size: 48px; color: #f57c00; }
            h1 { color: #015E5E; margin-top: 20px; margin-bottom: 10px; font-size: 24px; }
            p { line-height: 1.6; color: #5C6B6B; font-size: 16px; }
            .important-box { background-color: #FFD580; padding: 20px; margin-top: 20px; border-radius: 5px; text-align: center; border-left: 5px solid #f57c00; }
            .important-box h2 { margin: 0 0 10px 0; color: #e65100; font-size: 18px; }
            .button-container { text-align: center; margin-top: 30px; }
            .button-action { background-color: #f57c00; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; }
            .fallback-link { font-size: 12px; color: #777; margin-top: 20px; }
            .fallback-link a { color: #777; }
            .footer { background-color: #015E5E; padding: 20px; text-align: center; color: #ffffff; }
            .footer p { color: #e0e0e0; font-size: 12px; margin: 5px 0; }
            .footer a { color: #ffffff; text-decoration: underline; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="${LOGO_URL}" alt="GEM Plus Logo">
            </div>
            <div class="content">
                <div class="content-icon">&#128273;</div>
                <h1>Restablece tu Contraseña</h1>
                <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta. Si no hiciste esta solicitud, puedes ignorar este correo de forma segura.</p>
                
                <div class="button-container">
                    <a href="${resetUrl}" class="button-action">Restablecer Contraseña</a>
                </div>

                <div class="important-box">
                    <h2>Aviso de Seguridad</h2>
                    <p style="font-size: 14px; color: #e65100;">Este enlace es válido por <strong>1 hora</strong> desde el momento en que se solicitó.</p>
                </div>
                
                <p class="fallback-link">Si tienes problemas con el botón, copia y pega la siguiente URL en tu navegador:<br><a href="${resetUrl}">${resetUrl}</a></p>
            </div>
            <div class="footer">
                <p>GEM Plus - Gestión de Pacientes y Turnos</p>
                <p>Este es un mensaje automático, por favor no respondas a este correo.</p>
            </div>
        </div>
    </body>
    </html>
    `;

    const mailOptions = {
        from: `"${process.env.SENDER_NAME || 'GEM Plus'}" <${process.env.SENDER_EMAIL}>`,
        to: userEmail,
        subject: 'Restablecimiento de Contraseña',
        html: htmlContent,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email de reseteo de contraseña enviado a ${userEmail}`);
    } catch (error) {
        console.error(`Error al enviar email de reseteo a ${userEmail}:`, error);
        throw new Error('No se pudo enviar el correo de restablecimiento.');
    }
};

export const sendDailyAgendaEmail = async (professionalEmail, professionalName, appointments) => {
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD || !process.env.SENDER_EMAIL) {
        return; 
    }

    const today = DateTime.now().setZone('America/Argentina/Buenos_Aires').toFormat('cccc, dd \'de\' LLLL', { locale: 'es' });

    let appointmentsListHtml = '';
    if (appointments.length === 0) {
        appointmentsListHtml = '<p>No tienes turnos programados para hoy.</p>';
    } else {
        appointmentsListHtml = '<ul>' + appointments.map(appt => {
            const formattedTime = DateTime.fromISO(appt.dateTime, { zone: 'utc' }).setZone('America/Argentina/Buenos_Aires').toFormat('HH:mm');
            return `<li style="margin-bottom: 10px;"><strong>${formattedTime} hs:</strong> ${appt.patientName} <em>(en ${appt.locationName})</em></li>`;
        }).join('') + '</ul>';
    }

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e0e0e0; }
            .header { background-color: #ffffff; padding: 20px; text-align: center; border-bottom: 1px solid #e0e0e0; }
            .header img { height: 50px; }
            .content { padding: 30px; text-align: left; color: #2E3A3A; }
            .content-icon { font-size: 48px; color: #028184; text-align: center; }
            h1 { color: #015E5E; margin-top: 20px; margin-bottom: 10px; font-size: 24px; text-align: center; }
            p { line-height: 1.6; color: #5C6B6B; font-size: 16px; }
            ul { list-style-type: none; padding-left: 0; }
            li { background-color: #F9FAFA; padding: 10px; border-radius: 5px; border-left: 3px solid #028184; }
            .button-container { text-align: center; margin-top: 30px; }
            .button { background-color: #028184; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; }
            .footer { background-color: #015E5E; padding: 20px; text-align: center; color: #ffffff; }
            .footer p { color: #e0e0e0; font-size: 12px; margin: 5px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                 <img src="${LOGO_URL}" alt="GEM Plus Logo">
            </div>
            <div class="content">
                <div class="content-icon">&#128214;</div>
                <h1>Tu Agenda para Hoy</h1>
                <p>¡Hola, <strong>${professionalName}</strong>!</p>
                <p>Aquí tienes un resumen de tus turnos programados para hoy, ${today}:</p>
                
                ${appointmentsListHtml}

                <div class="button-container">
                    <a href="${process.env.FRONTEND_URL}/profesional/dashboard/agenda" class="button">Ver Agenda Completa</a>
                </div>
            </div>
            <div class="footer">
                <p>GEM Plus - Gestión de Pacientes y Turnos</p>
                <p>Este es un resumen automático. Puedes desactivar estos correos desde tu perfil.</p>
            </div>
        </div>
    </body>
    </html>
    `;

    const mailOptions = {
        from: `"${process.env.SENDER_NAME || 'GEM Plus - Agenda'}" <${process.env.SENDER_EMAIL}>`,
        to: professionalEmail,
        subject: `Tu Agenda para Hoy, ${today}`,
        html: htmlContent,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email de agenda diaria enviado a ${professionalEmail}`);
    } catch (error) {
        console.error(`Error al enviar email de agenda a ${professionalEmail}:`, error);
    }
};