import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: 465, // Use port 465 for SSL
    secure: true, // Use SSL
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    // Force IPv4 to avoid Gmail IPv6 issues on some hosting platforms
    family: 4
});

export const sendEmail = async (to, subject, html) => {
    try {
        const info = await transporter.sendMail({
            from: `FabLab Reservations <${process.env.SMTP_FROM}>`,
            to,
            subject,
            html,
        });
        console.log('Message sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

const formatTime = (hour) => {
    if (hour === 24) return '00:00';
    return `${hour.toString().padStart(2, '0')}:00`;
};

export const sendReservationPendingEmail = async (userEmail, reservationDetails) => {
    const subject = 'Votre réservation est en attente de validation';
    const html = `
    <h1>Réservation reçue</h1>
    <p>Bonjour ${reservationDetails.nom},</p>
    <p>Votre demande de réservation pour le <strong>${reservationDetails.date}</strong> de <strong>${formatTime(reservationDetails.startHour)}</strong> à <strong>${formatTime(reservationDetails.endHour)}</strong> a bien été reçue.</p>
    <p>Espaces demandés : ${reservationDetails.spaces.join(', ')}</p>
    <p>Nous l'examinerons dans les plus brefs délais et vous recevrez un email de confirmation ou de refus.</p>
    <p>Cordialement,<br>L'équipe FabLab</p>
  `;
    await sendEmail(userEmail, subject, html);
};

export const sendAdminNotificationEmail = async (adminEmail, reservationDetails) => {
    const subject = 'Nouvelle demande de réservation';
    const html = `
    <h1>Nouvelle Réservation</h1>
    <p><strong>Nom:</strong> ${reservationDetails.nom}</p>
    <p><strong>Établissement:</strong> ${reservationDetails.etablissement}</p>
    <p><strong>Téléphone:</strong> ${reservationDetails.telephone}</p>
    <p><strong>Email:</strong> ${reservationDetails.email}</p>
    <p><strong>Date:</strong> ${reservationDetails.date}</p>
    <p><strong>Heure:</strong> ${formatTime(reservationDetails.startHour)} - ${formatTime(reservationDetails.endHour)}</p>
    <p><strong>Espaces:</strong> ${reservationDetails.spaces.join(', ')}</p>
    <p><strong>Note:</strong> ${reservationDetails.note}</p>
    <p><a href="${process.env.FRONTEND_URL}/admin">Accéder au tableau de bord</a> pour approuver ou refuser.</p>
  `;
    await sendEmail(adminEmail, subject, html);
};

export const sendReservationStatusEmail = async (userEmail, status, reservationDetails, suggestion = '') => {
    const subject = status === 'approved' ? 'Réservation Confirmée ✅' : 'Réservation Refusée ❌';
    const color = status === 'approved' ? 'green' : 'red';
    const statusText = status === 'approved' ? 'approuvée' : 'refusée';

    let additionalMessage = '';
    if (status === 'denied') {
        if (suggestion) {
            additionalMessage = `<p><strong>Suggestion de l'administrateur :</strong> ${suggestion}</p>`;
        } else {
            additionalMessage = '<p>Désolé, le créneau n\'est pas disponible ou ne correspond pas à nos critères.</p>';
        }
    } else {
        additionalMessage = '<p>Nous avons hâte de vous voir !</p>';
    }

    const html = `
    <h1>Votre réservation a été <span style="color: ${color}">${statusText}</span></h1>
    <p>Bonjour ${reservationDetails.nom},</p>
    <p>Votre demande de réservation pour le <strong>${reservationDetails.date}</strong> a été <strong>${statusText}</strong>.</p>
    ${additionalMessage}
    <p>Cordialement,<br>L'équipe FabLab</p>
  `;
    await sendEmail(userEmail, subject, html);
};
