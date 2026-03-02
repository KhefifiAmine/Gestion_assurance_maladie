const API_BASE = 'http://localhost:5000/api';

// Helper: récupérer le token stocké
const getToken = () => localStorage.getItem('token');

// Helper pour les requêtes authentifiées
const authHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`
});

// ─── AUTH ────────────────────────────────────────────────
export const loginUser = async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
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
        email: formData.email,
        password: formData.password
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

export const deleteAccount = async () => {
    const res = await fetch(`${API_BASE}/profile`, {
        method: 'DELETE',
        headers: authHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erreur lors de la suppression du compte.');
    return data;
};
