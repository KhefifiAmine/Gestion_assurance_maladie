export const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
export const UPLOADS_BASE = (import.meta.env.VITE_UPLOADS_URL || API_BASE.replace(/\/api$/, '')).replace(/\/$/, '');


// Helper: récupérer le token stocké
const getToken = () => localStorage.getItem('token');

// Helper pour les requêtes authentifiées
const authHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`
});

// Helper: gérer les erreurs de réponse globalement
export const handleResponse = async (res) => {
    const data = await res.json();

    if (res.status === 401) {
        // On déclenche un événement personnalisé pour que AuthContext puisse réagir
        window.dispatchEvent(new CustomEvent('auth-error', {
            detail: { message: data.message, isBlocked: data.isBlocked }
        }));


    }

    if (!res.ok) {
        throw new Error(data.message || data.error || 'Une erreur est survenue.');
    }
    return data;
};

// ─── AUTH ────────────────────────────────────────────────
export const loginUser = async (email, password, isAdminLogin = false) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, isAdminLogin })
    });
    return handleResponse(res);
};

export const registerUser = async (formData) => {
    const payload = {
        nom: formData.nom,
        prenom: formData.prenom,
        telephone: formData.telephone,
        ddn: formData.ddn,
        adresse: formData.adresse,
        email: formData.email,
        ville: formData.ville,
        sexe: formData.sexe
    };
    const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    return handleResponse(res);
};


export const forgotPassword = async (email) => {
    const res = await fetch(`${API_BASE}/reset-password/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    });
    return handleResponse(res);
};

export const verifyResetCode = async (code) => {
    const res = await fetch(`${API_BASE}/reset-password/verify-reset-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
    });
    return handleResponse(res);
};

export const resetPassword = async (code, newPassword) => {
    const res = await fetch(`${API_BASE}/reset-password/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, newPassword })
    });
    return handleResponse(res);
};



// ─── PROFILE ─────────────────────────────────────────────
export const fetchProfile = async () => {
    const res = await fetch(`${API_BASE}/profile`, {
        method: 'GET',
        headers: authHeaders()
    });
    const data = await handleResponse(res);
    return data.user;
};

export const updateProfile = async (profileData, avatarFile = null) => {
    const formData = new FormData();
    Object.keys(profileData).forEach(key => {
        if (profileData[key] !== null && profileData[key] !== undefined) {
            formData.append(key, profileData[key]);
        }
    });

    if (avatarFile) {
        formData.append('avatar', avatarFile);
    }

    const res = await fetch(`${API_BASE}/profile`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${getToken()}`
        },
        body: formData
    });
    const data = await handleResponse(res);
    return data.user;
};

export const changePassword = async (ancienMdp, nouveauMdp) => {
    const res = await fetch(`${API_BASE}/profile/change-password`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ ancienMdp, nouveauMdp })
    });
    return handleResponse(res);
};


