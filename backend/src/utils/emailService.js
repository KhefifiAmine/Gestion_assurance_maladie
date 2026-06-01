// utils/emailService.js
console.log("📂 [Boot] Chargement du service Email (Resend)...");
const { Resend } = require('resend');

if (!process.env.RESEND_API) {
  console.error("⚠️ [Email Service] ATTENTION: RESEND_API n'est pas défini dans l'environnement !");
}

const resend = new Resend(process.env.RESEND_API);

// Default sender for Resend (Using onboarding@resend.dev if domain not verified)
const DEFAULT_FROM = "CareCover <onboarding@resend.dev>";

const sendResetEmail = async (email, code) => {
  try {
    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to: email,
      subject: 'Réinitialisation de votre mot de passe',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Réinitialisation de mot de passe</h2>
          <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
          <p>Voici un code de verification pour créer un nouveau mot de passe : <strong>${code}</strong></p>
          <p><strong>Ce code expirera dans 30 minutes.</strong></p>
          <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
          <hr style="margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            Cet email a été envoyé automatiquement via Resend, merci de ne pas y répondre.
          </p>
        </div>
      `
    });

    if (error) {
      console.error('❌ [Email Service] Erreur Resend reset password:', error);
      return false;
    }

    console.log(`✅ [Email Service] Réinitialisation envoyée à: ${email}`);
    return true;
  } catch (error) {
    console.error('❌ [Email Service] Erreur critique envoi reset password:', error);
    return false;
  }
};

const sendApprovalEmail = async (email) => {
  try {
    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
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
    });

    if (error) {
      console.error('❌ [Email Service] Erreur Resend approbation:', error);
      return false;
    }

    console.log(`✅ [Email Service] Approbation envoyée à: ${email}`);
    return true;
  } catch (error) {
    console.error('❌ [Email Service] Erreur critique envoi approbation:', error);
    return false;
  }
};

const sendRejectionEmail = async (email, objet, raison = "") => {
  try {
    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to: email,
      subject: 'Votre demande de compte a été refusée',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Information concernant votre demande</h2>
          <p>Nous sommes désolés de vous informer que votre demande de création de compte a été refusée par l'administrateur.</p>
          ${objet ? `<p><strong>Objet :</strong> ${objet}</p>` : ''}
          ${raison ? `<p><strong>Raison :</strong> ${raison}</p>` : ''}
          <p>Pour plus d'informations, veuillez contacter le support.</p>
          <hr style="margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            Cet email a été envoyé automatiquement, merci de ne pas y répondre.
          </p>
        </div>
      `
    });

    if (error) {
      console.error('❌ [Email Service] Erreur Resend email de refus:', error);
      return false;
    }

    console.log(`✅ [Email Service] Email de refus envoyé à: ${email}`);
    return true;
  } catch (error) {
    console.error('❌ [Email Service] Erreur critique envoi email de refus:', error);
    return false;
  }
};

const sendBlockEmail = async (email, objet, raison = "") => {
  try {
    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to: email,
      subject: 'Votre compte a été bloqué',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Alerte de Sécurité</h2>
          <p>Nous vous informons que votre compte a été bloqué / désactivé par l'administrateur.</p>
          ${objet ? `<p><strong>Objet :</strong> ${objet}</p>` : ''}
          ${raison ? `<p><strong>Raison :</strong> ${raison}</p>` : ''}
          <p>Si vous pensez qu'il s'agit d'une erreur, veuillez contacter le support.</p>
          <hr style="margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            Cet email a été envoyé automatiquement, merci de ne pas y répondre.
          </p>
        </div>
      `
    });

    if (error) {
      console.error('❌ [Email Service] Erreur Resend email de blocage:', error);
      return false;
    }

    console.log(`✅ [Email Service] Email de blocage envoyé à: ${email}`);
    return true;
  } catch (error) {
    console.error('❌ [Email Service] Erreur critique envoi email de blocage:', error);
    return false;
  }
};

/**
 * Envoie un email de notification générique à un utilisateur.
 */
const sendNotificationEmail = async (email, titre, description) => {
  try {
    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
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
    });

    if (error) {
      console.error('❌ [Email Service] Erreur Resend notification:', error);
      return false;
    }

    console.log(`✅ [Email Service] Email de notification envoyé à: ${email}`);
    return true;
  } catch (error) {
    console.error('❌ [Email Service] Erreur critique envoi email notification:', error);
    return false;
  }
};

/**
 * Envoie un email d'alerte lors d'une nouvelle connexion.
 */
const sendLoginNotificationEmail = async (email, prenom) => {
  const date = new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Tunis' });
  try {
    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to: email,
      subject: '🔔 Nouvelle connexion à votre compte',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 30px; text-align: center;">
            <h2 style="color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 1px;">CareCover Security</h2>
          </div>
          <div style="padding: 40px 30px;">
            <h3 style="color: #0f172a; margin-top: 0; font-size: 18px;">Bonjour ${prenom},</h3>
            <p style="color: #475569; line-height: 1.6; font-size: 15px;">
              Une nouvelle connexion à votre compte a été détectée.
            </p>
            <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin: 25px 0; border: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #64748b; font-size: 13px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">Détails de la connexion</p>
              <p style="margin: 10px 0 0; color: #1e293b; font-size: 14px;"><strong>Date :</strong> ${date}</p>
            </div>
            <p style="color: #475569; line-height: 1.6; font-size: 14px;">
              Si c'était vous, vous pouvez ignorer cet e-mail. Si vous ne reconnaissez pas cette activité, nous vous recommandons de <strong>changer votre mot de passe immédiatement</strong> depuis votre espace adhérent.
            </p>
          </div>
          <div style="background: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 11px; margin: 0;">
              Ceci est un message automatique de sécurité. Ne pas répondre.
            </p>
          </div>
        </div>
      `
    });

    if (error) {
      console.error('❌ [Email Service] Erreur Resend alerte login:', error);
      return false;
    }

    console.log(`✅ [Email Service] Alerte login envoyée à: ${email}`);
    return true;
  } catch (error) {
    console.error('❌ [Email Service] Erreur critique envoi alerte login:', error);
    return false;
  }
};

/**
 * Envoie une alerte email au Super Admin lors du dépassement du rate limit.
 */
const sendRateLimitAlertEmail = async (superAdminEmail, ip, limiterName, path) => {
  const date = new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Tunis' });
  try {
    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to: superAdminEmail,
      subject: '🚨 Alerte Sécurité — Dépassement de limite de requêtes',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #eee; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08);">
          <div style="background: linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%); padding: 28px 30px; text-align: center;">
            <h2 style="color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 1px;">🚨 Alerte Sécurité</h2>
            <p style="color: rgba(255,255,255,0.75); margin: 6px 0 0; font-size: 13px;">CareCover — Système de Détection d'Abus</p>
          </div>
          <div style="padding: 32px 30px;">
            <p style="color: #1e293b; font-size: 16px; font-weight: 600; margin-top: 0;">
              Une adresse IP a dépassé la limite de requêtes autorisées.
            </p>
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 20px; margin: 24px 0;">
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                  <td style="padding: 8px 0; color: #64748b; width: 40%; font-weight: 600;">🌐 Adresse IP</td>
                  <td style="padding: 8px 0; color: #0f172a; font-family: monospace; font-weight: 700;">${ip}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: 600;">🔒 Limiteur</td>
                  <td style="padding: 8px 0; color: #dc2626; font-weight: 600;">${limiterName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: 600;">📍 Route</td>
                  <td style="padding: 8px 0; color: #1e293b;">${path}</td>
                </tr>
              </table>
            </div>
          </div>
          <div style="background: #f8fafc; padding: 18px 30px; border-top: 1px solid #e2e8f0; text-align: center;">
            <p style="color: #94a3b8; font-size: 11px; margin: 0;">
              Alerte automatique du système CareCover.
            </p>
          </div>
        </div>
      `
    });

    if (error) {
      console.error('❌ [Email Service] Erreur Resend alerte rate limit:', error);
      return false;
    }

    console.log(`✅ [Email Service] Alerte rate limit envoyée (IP: ${ip})`);
    return true;
  } catch (error) {
    console.error('❌ [Email Service] Erreur critique envoi alerte rate limit:', error);
    return false;
  }
};

module.exports = {
  sendResetEmail,
  sendApprovalEmail,
  sendRejectionEmail,
  sendBlockEmail,
  sendNotificationEmail,
  sendLoginNotificationEmail,
  sendRateLimitAlertEmail
};