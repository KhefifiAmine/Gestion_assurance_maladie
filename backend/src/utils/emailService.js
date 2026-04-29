// utils/emailService.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendResetEmail = async (email, code) => {

  const mailOptions = {
    from: `"Votre Application" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Réinitialisation de votre mot de passe',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Réinitialisation de mot de passe</h2>
        <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
        <p>Voici un code de verification pour créer un nouveau mot de passe : ${code}</p>
        <p><strong>Ce code expirera dans 30 minutes.</strong></p>
        <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
        <hr style="margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          Cet email a été envoyé automatiquement, merci de ne pas y répondre.
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email de réinitialisation envoyé à: ${email}`);
    return true;
  } catch (error) {
    console.error('Erreur envoi email:', error);
    return false;
  }
};

const sendApprovalEmail = async (email) => {
  const mailOptions = {
    from: `"Votre Application" TT Asurance`,
    to: email,
    subject: 'Votre compte a été approuvé',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Félicitations !</h2>
        <p>Votre demande de création de compte a été approuvée par l'administrateur.</p>
        <p>Votre compte est actif. Pour des raisons de sécurité, aucun mot de passe n'est envoyé par email.</p>
        <p>Utilisez la fonctionnalité <strong>Mot de passe oublié</strong> pour définir votre mot de passe.</p>
        <hr style="margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          Cet email a été envoyé automatiquement, merci de ne pas y répondre.
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email d'approbation envoye a: ${email}`);
    return true;
  } catch (error) {
    console.error('Erreur envoi email d\'approbation:', error);
    return false;
  }
};

const sendRejectionEmail = async (email, raison = "") => {
  const mailOptions = {
    from: `"Votre Application" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Votre demande de compte a été refusée',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Information concernant votre demande</h2>
        <p>Nous sommes désolés de vous informer que votre demande de création de compte a été refusée par l'administrateur.</p>
        ${raison ? `<p><strong>Raison :</strong> ${raison}</p>` : ''}
        <p>Pour plus d'informations, veuillez contacter le support.</p>
        <hr style="margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          Cet email a été envoyé automatiquement, merci de ne pas y répondre.
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email de refus envoye a: ${email}`);
    return true;
  } catch (error) {
    console.error('Erreur envoi email de refus:', error);
    return false;
  }
};

const sendBlockEmail = async (email, raison = "") => {
  const mailOptions = {
    from: `"Votre Application" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Votre compte a été bloqué',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Alerte de Sécurité</h2>
        <p>Nous vous informons que votre compte a été bloqué / désactivé par l'administrateur.</p>
        ${raison ? `<p><strong>Raison :</strong> ${raison}</p>` : ''}
        <p>Si vous pensez qu'il s'agit d'une erreur, veuillez contacter le support.</p>
        <hr style="margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          Cet email a été envoyé automatiquement, merci de ne pas y répondre.
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email de blocage envoye a: ${email}`);
    return true;
  } catch (error) {
    console.error('Erreur envoi email de blocage:', error);
    return false;
  }
};


/**
 * Envoie un email de notification générique à un utilisateur.
 * @param {string} email - Adresse email du destinataire
 * @param {string} titre - Titre de la notification
 * @param {string} description - Corps du message de notification
 */
const sendNotificationEmail = async (email, titre, description) => {
  const mailOptions = {
    from: `"CareCover - Notifications" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: titre,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #4B0082 0%, #7C3AED 100%); padding: 24px; text-align: center;">
          <h2 style="color: #ffffff; margin: 0; font-size: 20px;">CareCover</h2>
          <p style="color: rgba(255,255,255,0.7); margin: 4px 0 0; font-size: 12px;">Système de Gestion d'Assurance Maladie</p>
        </div>
        <div style="padding: 32px 24px;">
          <h3 style="color: #1F2937; margin-top: 0;">${titre}</h3>
          <p style="color: #4B5563; line-height: 1.6;">${description}</p>
        </div>
        <div style="background: #F9FAFB; padding: 16px 24px; border-top: 1px solid #E5E7EB;">
          <p style="color: #9CA3AF; font-size: 11px; margin: 0; text-align: center;">
            Cet email a été envoyé automatiquement, merci de ne pas y répondre.
          </p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email de notification envoyé à: ${email}`);
    return true;
  } catch (error) {
    console.error('Erreur envoi email notification:', error);
    return false;
  }
};

module.exports = { sendResetEmail, sendApprovalEmail, sendRejectionEmail, sendBlockEmail, sendNotificationEmail };