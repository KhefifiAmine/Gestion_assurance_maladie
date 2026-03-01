import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  CheckCircle2,
  CreditCard,
  Mail,
  Phone,
  Users,
  FileText,
  MessageSquare,
  Edit2,
  Camera,
  Eye,
  AlertCircle,
  Home,
  Lock,
  Calendar,
  MapPin,
  Hash,
  Activity,
  ChevronRight,
  Loader2,
  X,
  Check,
  LogOut,
  Trash2,
  Key
} from 'lucide-react';
import './Profile.css';
import { useAuth } from '../context/AuthContext';
import { updateProfile, changePassword, deleteAccount } from '../services/api';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('beneficiaires');
  const [avatar, setAvatar] = useState(null);
  const [avatarError, setAvatarError] = useState(null);
  const [isEditingDet, setIsEditingDet] = useState(false);
  const [isChangingPwd, setIsChangingPwd] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notif, setNotif] = useState(null);
  const fileInputRef = useRef(null);

  // État temporaire pour l'édition des informations
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});

  // État pour le changement de mot de passe
  const [pwdForm, setPwdForm] = useState({ ancienMdp: '', nouveauMdp: '', confirmMdp: '' });
  const [pwdErrors, setPwdErrors] = useState({});

  useEffect(() => {
    if (user) {
      setForm({
        nom: user.nom || '',
        prenom: user.prenom || '',
        adresse: user.adresse || '',
        telephone: user.telephone || '',
        ddn: user.ddn ? user.ddn.split('T')[0] : '', // Pour les champs 'date' HTML5
        ville: user.ville || ''
      });
    }
  }, [user, isEditingDet]); // Rénitialise si on annule

  useEffect(() => {
    if (notif) {
      const timer = setTimeout(() => setNotif(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notif]);

  // Validation Infos
  const validate = () => {
    const newErrs = {};
    if (!form.nom || form.nom.trim().length < 2) newErrs.nom = 'Minimum 2 caractères';
    if (!form.prenom || form.prenom.trim().length < 2) newErrs.prenom = 'Minimum 2 caractères';
    if (!form.adresse || form.adresse.trim().length < 10) newErrs.adresse = 'Minimum 10 caractères';
    if (!form.telephone || !/^\d{8}$/.test(form.telephone)) newErrs.telephone = 'Exactement 8 chiffres';
    if (!form.ddn) newErrs.ddn = 'La date est obligatoire';
    if (form.ville && form.ville.trim().length < 3) newErrs.ville = 'Minimum 3 caractères';

    setErrors(newErrs);
    return Object.keys(newErrs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      await updateProfile(form);
      await refreshUser();
      setIsEditingDet(false);
      setNotif({ type: 'success', text: 'Informations mises à jour avec succès !' });
    } catch (e) {
      setNotif({ type: 'error', text: e.message || 'Erreur lors de la mise à jour' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePwdSubmit = async () => {
    const errs = {};
    if (!pwdForm.ancienMdp) errs.ancienMdp = "Requis";
    if (!pwdForm.nouveauMdp || pwdForm.nouveauMdp.length < 6) errs.nouveauMdp = "Min 6 caractères";
    if (pwdForm.nouveauMdp !== pwdForm.confirmMdp) errs.confirmMdp = "Ne correspond pas";

    if (Object.keys(errs).length > 0) {
      setPwdErrors(errs);
      return;
    }

    try {
      setIsSaving(true);
      await changePassword(pwdForm.ancienMdp, pwdForm.nouveauMdp);
      setNotif({ type: 'success', text: 'Mot de passe modifié avec succès' });
      setIsChangingPwd(false);
      setPwdForm({ ancienMdp: '', nouveauMdp: '', confirmMdp: '' });
      setPwdErrors({});
    } catch (e) {
      setNotif({ type: 'error', text: e.message || 'Erreur' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer définitivement votre compte ? Cette action est irréversible.")) {
      try {
        await deleteAccount();
        logout();
        navigate('/login');
      } catch (e) {
        setNotif({ type: 'error', text: e.message || 'Erreur lors de la suppression' });
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    setAvatarError(null);
    if (!file) return;
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setAvatarError('Formats JPG/PNG uniquement.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Max 5 Mo.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setAvatar(reader.result);
    reader.readAsDataURL(file);
  };

  if (!user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Loader2 size={48} className="animate-spin" />
      </div>
    );
  }

  const beneficiaires = [
    { id: 1, nom: 'Ben Ali Sara', relation: 'Conjoint', color: '#F97316' },
    { id: 2, nom: 'Ben Ali Yassine', relation: 'Enfant', color: '#3B82F6' },
    { id: 3, nom: 'Ben Ali Mariem', relation: 'Enfant', color: '#10B981' },
    { id: 4, nom: 'Ben Ali Omar', relation: 'Enfant', color: '#8B5CF6' }
  ];

  const isValid = Object.keys(errors).length === 0 && form.nom && form.prenom && form.adresse && form.telephone;

  const DetailCard = ({ icon: Icon, label, value, color, name, editable = false, type = 'text', readOnlyValuePlaceholder = '—' }) => {
    const isEditing = isEditingDet && editable;
    const isReadOnly = !editable;

    return (
      <div className={`det-card ${isReadOnly ? 'read-only' : ''}`}>
        <div className={`det-icon-box ${isReadOnly ? 'lock' : color}`}>
          {isReadOnly ? <Lock size={20} /> : <Icon size={20} />}
        </div>
        <div className="det-info">
          <div className="det-label-v2">
            {label}
            {isReadOnly && <span className="det-badge-lock">Non modifiable</span>}
          </div>
          {isEditing ? (
            name === 'adresse' ? (
              <textarea
                className="det-textarea"
                value={form[name] || ''}
                onChange={e => {
                  setForm({ ...form, [name]: e.target.value });
                  if (errors[name]) setErrors({ ...errors, [name]: null });
                }}
              />
            ) : (
              <input
                type={type}
                className="det-input"
                value={form[name] || ''}
                onChange={e => {
                  setForm({ ...form, [name]: e.target.value });
                  if (errors[name]) setErrors({ ...errors, [name]: null });
                }}
              />
            )
          ) : (
            <p className="det-value-v2">
              {type === 'date' && value ? new Date(value).toLocaleDateString('fr-FR') : (value || readOnlyValuePlaceholder)}
            </p>
          )}
          {isEditing && errors[name] && <div className="det-error">{errors[name]}</div>}
        </div>
      </div>
    );
  };

  return (
    <div className="prof-page-bg">
      <div className="prof-main-card">

        {/* Professional Toast Notification */}
        {notif && (
          <div className="toast-container-tr">
            <div className={`prof-toast ${notif.type}`}>
              <div className="prof-toast-icon">
                {notif.type === 'success' ? <CheckCircle2 size={22} /> : <AlertCircle size={22} />}
              </div>
              <div className="prof-toast-content">
                <h4>{notif.type === 'success' ? 'Succès' : 'Erreur'}</h4>
                <p>{notif.text}</p>
              </div>
              <div className="prof-toast-progress">
                <div className="prof-toast-progress-fill"></div>
              </div>
            </div>
          </div>
        )}

        {/* ── HEADER ── */}
        <div className="prof-header-flex">
          <div className="prof-avatar-box" style={{ position: 'relative' }}>
            <div className="prof-avatar-circle">
              {avatar ? <img src={avatar} alt="Preview" /> : <User size={64} strokeWidth={1} />}
            </div>
            <input type="file" className="hidden" ref={fileInputRef} onChange={handleAvatarChange} accept=".jpg,.jpeg,.png" style={{ display: 'none' }} />
            <label className="prof-avatar-overlay" onClick={() => fileInputRef.current?.click()}>
              <Camera size={24} />
              <span>Changer</span>
            </label>
            <div className="prof-cam-btn"><Camera size={18} /></div>
            {avatarError && <div style={{ position: 'absolute', top: '100%', left: 0, color: 'red', fontSize: '10px', width: '128px', textAlign: 'center' }}>{avatarError}</div>}
          </div>

          <div className="prof-info-center">
            <h1>{user.prenom} {user.nom} <CheckCircle2 size={28} className="prof-verify-icon" fill="currentColor" /></h1>
            <div className="prof-sub-rows">
              <div className="prof-sub-row"><CreditCard size={18} /> <span>{user.matricule}</span></div>
              <div className="prof-sub-row"><Mail size={18} /> <span>{user.email}</span></div>
              <div className="prof-sub-row"><Phone size={18} /> <span>{user.telephone}</span></div>
            </div>
          </div>

          <div className="prof-stats-row">
            <div className="prof-stat-card blue"><div className="prof-stat-icon-box"><Users size={20} /></div><span className="prof-stat-num">4</span><span className="prof-stat-label">Bénéficiaires</span></div>
            <div className="prof-stat-card green"><div className="prof-stat-icon-box"><FileText size={20} /></div><span className="prof-stat-num">12</span><span className="prof-stat-label">Bulletins</span></div>
            <div className="prof-stat-card red"><div className="prof-stat-icon-box"><MessageSquare size={20} /></div><span className="prof-stat-num">2</span><span className="prof-stat-label">Réclamations</span></div>
          </div>

          <div style={{ alignSelf: 'flex-start', marginLeft: 'auto' }}>
            <button className="prof-edit-btn" style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', display: 'flex', gap: '8px', alignItems: 'center' }} onClick={handleLogout}>
              <LogOut size={16} /> Déconnexion
            </button>
          </div>
        </div>

        {/* ── ONGLETS ── */}
        <div className="prof-tabs-nav">
          <div className={`prof-tab-btn ${activeTab === 'beneficiaires' ? 'active' : ''}`} onClick={() => setActiveTab('beneficiaires')}>Bénéficiaires</div>
          <div className={`prof-tab-btn ${activeTab === 'adhesion' ? 'active' : ''}`} onClick={() => setActiveTab('adhesion')}>Détails d'adhésion</div>
          <div className={`prof-tab-btn ${activeTab === 'securite' ? 'active' : ''}`} onClick={() => setActiveTab('securite')}>Sécurité</div>
        </div>

        {/* ── CONTENU ── */}
        <div className="prof-tab-content">
          {activeTab === 'beneficiaires' && (
            <div className="benef-grid-rows">
              {beneficiaires.map(b => (
                <div key={b.id} className="benef-mini-card">
                  <div className="benef-mini-left">
                    <div className="benef-mini-avatar" style={{ backgroundColor: b.color }}>{b.nom.split(' ').map(n => n[0]).join('')}</div>
                    <div><div className="benef-mini-name">{b.nom}</div><div className="benef-mini-type">{b.relation}</div></div>
                  </div>
                  <button className="benef-view-btn"><Eye size={14} /> Détails</button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'adhesion' && (
            <div className="adhesion-section">
              <div className="det-header">
                <h3>Informations du compte</h3>
                {!isEditingDet ? (
                  <button className="prof-edit-btn" style={{ position: 'static' }} onClick={() => setIsEditingDet(true)}>
                    <Edit2 size={16} /> Modifier
                  </button>
                ) : (
                  <div className="edit-actions">
                    <button className="btn-cancel-edit" onClick={() => { setIsEditingDet(false); setErrors({}); }}>
                      <X size={18} /> Annuler
                    </button>
                    <button className="btn-save-edit" disabled={isSaving || !isValid} onClick={handleSave}>
                      {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                      <span>{isSaving ? 'Enregistrement...' : 'Enregistrer'}</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="det-grid">
                <DetailCard icon={User} label="Nom" value={user.nom} color="blue" name="nom" editable />
                <DetailCard icon={User} label="Prénom" value={user.prenom} color="blue" name="prenom" editable />
                <DetailCard icon={Calendar} label="Date de naissance" value={user.ddn} color="blue" name="ddn" type="date" editable />
                <DetailCard icon={Phone} label="Téléphone" value={user.telephone} color="rose" name="telephone" editable />
                <DetailCard icon={Home} label="Ville" value={user.ville} color="green" name="ville" editable />
                <DetailCard icon={MapPin} label="Adresse" value={user.adresse} color="green" name="adresse" editable />

                <DetailCard icon={Hash} label="Matricule" value={user.matricule} />
                <DetailCard icon={Mail} label="Email" value={user.email} />
                <DetailCard icon={Calendar} label="Date d'adhésion" value={user.createdAt} type="date" />
              </div>
            </div>
          )}

          {activeTab === 'securite' && (
            <div className="adhesion-section">
              <div className="det-header" style={{ marginBottom: '20px' }}>
                <h3>Paramètres de sécurité</h3>
              </div>

              <div style={{ maxWidth: '500px', marginBottom: '40px' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                  <Key size={18} /> Modifier le mot de passe
                </h4>

                {isChangingPwd ? (
                  <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div className="form-group" style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px', fontWeight: 500 }}>Ancien mot de passe</label>
                      <input
                        type="password"
                        value={pwdForm.ancienMdp}
                        onChange={(e) => { setPwdForm({ ...pwdForm, ancienMdp: e.target.value }); setPwdErrors({ ...pwdErrors, ancienMdp: null }); }}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: pwdErrors.ancienMdp ? '1px solid red' : '1px solid #cbd5e1' }}
                      />
                      {pwdErrors.ancienMdp && <span style={{ color: 'red', fontSize: '12px' }}>{pwdErrors.ancienMdp}</span>}
                    </div>

                    <div className="form-group" style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px', fontWeight: 500 }}>Nouveau mot de passe</label>
                      <input
                        type="password"
                        value={pwdForm.nouveauMdp}
                        onChange={(e) => { setPwdForm({ ...pwdForm, nouveauMdp: e.target.value }); setPwdErrors({ ...pwdErrors, nouveauMdp: null }); }}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: pwdErrors.nouveauMdp ? '1px solid red' : '1px solid #cbd5e1' }}
                      />
                      {pwdErrors.nouveauMdp && <span style={{ color: 'red', fontSize: '12px' }}>{pwdErrors.nouveauMdp}</span>}
                    </div>

                    <div className="form-group" style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px', fontWeight: 500 }}>Confirmer le mot de passe</label>
                      <input
                        type="password"
                        value={pwdForm.confirmMdp}
                        onChange={(e) => { setPwdForm({ ...pwdForm, confirmMdp: e.target.value }); setPwdErrors({ ...pwdErrors, confirmMdp: null }); }}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: pwdErrors.confirmMdp ? '1px solid red' : '1px solid #cbd5e1' }}
                      />
                      {pwdErrors.confirmMdp && <span style={{ color: 'red', fontSize: '12px' }}>{pwdErrors.confirmMdp}</span>}
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => { setIsChangingPwd(false); setPwdForm({ ancienMdp: '', nouveauMdp: '', confirmMdp: '' }); setPwdErrors({}); }}
                        style={{ padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handlePwdSubmit}
                        disabled={isSaving}
                        style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: isSaving ? 'not-allowed' : 'pointer' }}
                      >
                        {isSaving ? 'En cours...' : 'Mettre à jour'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsChangingPwd(true)}
                    style={{ padding: '10px 20px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}
                  >
                    Demander le changement de mot de passe
                  </button>
                )}
              </div>

              <div style={{ maxWidth: '500px', borderTop: '1px solid #e2e8f0', paddingTop: '30px' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', color: '#dc2626' }}>
                  <Trash2 size={18} /> Zone de danger
                </h4>
                <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '15px' }}>
                  Une fois votre compte supprimé, toutes vos données (bulletins, profil) seront définitivement effacées du système.
                </p>
                <button
                  onClick={handleDeleteAccount}
                  style={{ padding: '10px 20px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Supprimer mon compte définitivement
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
