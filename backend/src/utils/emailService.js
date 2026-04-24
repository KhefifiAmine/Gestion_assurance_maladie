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

const sendApprovalEmail = async (email, password) => {
  const mailOptions = {
    from: `"Votre Application" TT Asurance`,
    to: email,
    subject: 'Votre compte a été approuvé',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Félicitations !</h2>
        <p>Votre demande de création de compte a été approuvée par l'administrateur.</p>
        <p>Voici vos identifiants de connexion :</p>
        <ul>
          <li><strong>Email :</strong> ${email}</li>
          <li><strong>Mot de passe :</strong> ${password}</li>
        </ul>
        <p>Nous vous recommandons de modifier ce mot de passe dès votre première connexion.</p>
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

module.exports = { sendResetEmail, sendApprovalEmail, sendRejectionEmail, sendBlockEmail };