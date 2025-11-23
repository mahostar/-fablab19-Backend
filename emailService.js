import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

// Configure SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendEmail = async (to, subject, html) => {
    try {
        console.log('📧 Sending email via SendGrid HTTP API to:', to);
        
        const msg = {
            to,
            from: {
                email: process.env.SENDGRID_FROM_EMAIL,
                name: 'FabLab Mahdia'
            },
            replyTo: process.env.SENDGRID_FROM_EMAIL,
            subject,
            html,
            text: html.replace(/<[^>]*>/g, ''), // Plain text fallback
            trackingSettings: {
                clickTracking: { enable: false },
                openTracking: { enable: false }
            },
            mailSettings: {
                bypassListManagement: {
                    enable: false
                }
            }
        };

        const response = await sgMail.send(msg);
        console.log('✅ Email sent successfully via SendGrid!');
        return response;
    } catch (error) {
        console.error('❌ Error sending email via SendGrid:', error);
        if (error.response) {
            console.error('SendGrid API Error:', error.response.body);
        }
        throw error;
    }
};

const formatTime = (hour) => {
    if (hour === 24) return '00:00';
    return `${hour.toString().padStart(2, '0')}:00`;
};

export const sendReservationPendingEmail = async (userEmail, reservationDetails) => {
    const subject = '✅ Réservation reçue - FabLab Mahdia';
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">✅ Réservation Reçue</h1>
    </div>
    
    <div style="background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; margin-bottom: 20px;">Bonjour <strong>${reservationDetails.nom}</strong>,</p>
        
        <p style="font-size: 15px; color: #555;">Votre demande de réservation a bien été reçue et est en cours d'examen.</p>
        
        <div style="background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${reservationDetails.date}</p>
            <p style="margin: 5px 0;"><strong>🕐 Horaire:</strong> ${formatTime(reservationDetails.startHour)} - ${formatTime(reservationDetails.endHour)}</p>
            <p style="margin: 5px 0;"><strong>📍 Espaces:</strong> ${reservationDetails.spaces.join(', ')}</p>
        </div>
        
        <p style="font-size: 14px; color: #666; margin-top: 20px;">Vous recevrez un email de confirmation ou de modification dans les plus brefs délais.</p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        
        <p style="font-size: 14px; color: #888; margin: 0;">Cordialement,<br><strong>L'équipe FabLab Mahdia</strong></p>
        <p style="font-size: 12px; color: #aaa; margin-top: 20px;">
            FabLab Mahdia Pionnière<br>
            63, rue de Syrie, 1002 Tunis Belvédère - Tunisie<br>
            Mahdia, 5100 TUN
        </p>
    </div>
</body>
</html>
  `;
    await sendEmail(userEmail, subject, html);
};

export const sendAdminNotificationEmail = async (adminEmail, reservationDetails) => {
    const subject = '🔔 Nouvelle demande de réservation - FabLab';
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #ff6b6b; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">🔔 Nouvelle Demande</h1>
    </div>
    
    <div style="background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; margin-bottom: 20px;">Une nouvelle demande de réservation nécessite votre attention.</p>
        
        <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 5px;">
            <h3 style="color: #ff6b6b; margin-top: 0;">👤 Informations Client</h3>
            <p style="margin: 8px 0;"><strong>Nom:</strong> ${reservationDetails.nom}</p>
            <p style="margin: 8px 0;"><strong>Établissement:</strong> ${reservationDetails.etablissement || 'Non spécifié'}</p>
            <p style="margin: 8px 0;"><strong>Téléphone:</strong> ${reservationDetails.telephone || 'Non spécifié'}</p>
            <p style="margin: 8px 0;"><strong>Email:</strong> ${reservationDetails.email}</p>
        </div>
        
        <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 5px;">
            <h3 style="color: #667eea; margin-top: 0;">📅 Détails de la Réservation</h3>
            <p style="margin: 8px 0;"><strong>Date:</strong> ${reservationDetails.date}</p>
            <p style="margin: 8px 0;"><strong>Horaire:</strong> ${formatTime(reservationDetails.startHour)} - ${formatTime(reservationDetails.endHour)}</p>
            <p style="margin: 8px 0;"><strong>Espaces:</strong> ${reservationDetails.spaces.join(', ')}</p>
            ${reservationDetails.note ? `<p style="margin: 8px 0;"><strong>Note:</strong> ${reservationDetails.note}</p>` : ''}
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/admin" style="display: inline-block; background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">Gérer la réservation</a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #aaa; margin: 0; text-align: center;">
            Système de gestion FabLab Mahdia<br>
            Cet email a été envoyé automatiquement
        </p>
    </div>
</body>
</html>
  `;
    await sendEmail(adminEmail, subject, html);
};

export const sendReservationStatusEmail = async (userEmail, status, reservationDetails, suggestion = '') => {
    const isApproved = status === 'approved';
    const subject = isApproved ? '✅ Réservation Confirmée - FabLab Mahdia' : '❌ Réservation Refusée - FabLab Mahdia';
    const color = isApproved ? '#4CAF50' : '#f44336';
    const bgColor = isApproved ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'linear-gradient(135deg, #f44336 0%, #e91e63 100%)';
    const statusText = isApproved ? 'approuvée' : 'refusée';
    const icon = isApproved ? '✅' : '❌';

    let additionalMessage = '';
    if (!isApproved) {
        if (suggestion) {
            additionalMessage = `
                <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px;">
                    <p style="margin: 0; color: #856404;"><strong>💡 Suggestion de l'administrateur:</strong><br>${suggestion}</p>
                </div>`;
        } else {
            additionalMessage = '<p style="color: #666;">Le créneau demandé n\'est malheureusement pas disponible. N\'hésitez pas à nous contacter pour trouver une alternative.</p>';
        }
    } else {
        additionalMessage = `
            <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <p style="margin: 0; color: #155724;"><strong>🎉 Votre réservation est confirmée !</strong><br>Nous avons hâte de vous accueillir au FabLab.</p>
            </div>`;
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: ${bgColor}; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">${icon} Réservation ${statusText}</h1>
    </div>
    
    <div style="background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; margin-bottom: 20px;">Bonjour <strong>${reservationDetails.nom}</strong>,</p>
        
        <p style="font-size: 15px; color: #555;">Votre demande de réservation pour le <strong>${reservationDetails.date}</strong> a été <strong style="color: ${color};">${statusText}</strong>.</p>
        
        <div style="background: white; padding: 20px; border-left: 4px solid ${color}; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${reservationDetails.date}</p>
            <p style="margin: 5px 0;"><strong>🕐 Horaire:</strong> ${formatTime(reservationDetails.startHour)} - ${formatTime(reservationDetails.endHour)}</p>
            <p style="margin: 5px 0;"><strong>📍 Espaces:</strong> ${reservationDetails.spaces.join(', ')}</p>
        </div>
        
        ${additionalMessage}
        
        ${isApproved ? `
        <div style="background: #e3f2fd; padding: 20px; margin: 20px 0; border-radius: 5px;">
            <p style="margin: 0; font-size: 14px; color: #1565c0;"><strong>📞 Besoin d'aide?</strong><br>
            N'hésitez pas à nous contacter si vous avez des questions.</p>
        </div>
        ` : ''}
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        
        <p style="font-size: 14px; color: #888; margin: 0;">Cordialement,<br><strong>L'équipe FabLab Mahdia</strong></p>
        <p style="font-size: 12px; color: #aaa; margin-top: 20px;">
            FabLab Mahdia Pionnière<br>
            63, rue de Syrie, 1002 Tunis Belvédère - Tunisie<br>
            Mahdia, 5100 TUN
        </p>
    </div>
</body>
</html>
  `;
    await sendEmail(userEmail, subject, html);
};
