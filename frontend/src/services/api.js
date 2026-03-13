const API_BASE = 'http://localhost:5000/api';

// Helper: récupérer le token stocké
const getToken = () => localStorage.getItem('token');

// Helper pour les requêtes authentifiées
const authHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`
});

// ─── AUTH ────────────────────────────────────────────────
export const loginUser = async (email, password, isAdminLogin = false) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, isAdminLogin })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erreur de connexion.');
    return data; // { token, user }
};

export const registerUser = async (formData) => {
    const payload = {
        nom: formData.nom,
        prenom: formData.prenom,
        matricule: formData.matricule,
        telephone: formData.telephone,
        ddn: formData.ddn,
        adresse: formData.adresse,
        email: formData.email
    };
    const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erreur d\'inscription.');
    return data;
};


export const forgotPassword = async (email) => {
    const res = await fetch(`${API_BASE}/reset-password/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erreur lors de la demande de réinitialisation.');
    return data;
};

export const verifyResetCode = async (code) => {
    const res = await fetch(`${API_BASE}/reset-password/verify-reset-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Code invalide ou expiré.');
    return data;
};

export const resetPassword = async (code, newPassword) => {
    const res = await fetch(`${API_BASE}/reset-password/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, newPassword })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erreur lors de la réinitialisation.');
    return data;
};



// ─── PROFILE ─────────────────────────────────────────────
export const fetchProfile = async () => {
    const res = await fetch(`${API_BASE}/profile`, {
        method: 'GET',
        headers: authHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erreur lors de la récupération du profil.');
    return data.user;
};

export const updateProfile = async (profileData) => {
    const res = await fetch(`${API_BASE}/profile`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(profileData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erreur lors de la mise à jour du profil.');
    return data.user;
};

export const changePassword = async (ancienMdp, nouveauMdp) => {
    const res = await fetch(`${API_BASE}/profile/change-password`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ ancienMdp, nouveauMdp })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erreur lors du changement de mot de passe.');
    return data;
};


