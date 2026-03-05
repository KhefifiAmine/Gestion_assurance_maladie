import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { resetPassword } from '../services/api';
import './Auth.css';

const ResetPassword = () => {
    const location = useLocation();
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [apiError, setApiError] = useState('');
    const [apiSuccess, setApiSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Rediriger vers forget password si aucun code n'est transmis
        if (location.state && location.state.code) {
            setCode(location.state.code);
        } else {
            navigate('/forgot-password');
        }
    }, [location.state, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setApiError('');
        setApiSuccess('');

        if (!newPassword || !confirmPassword) {
            setApiError('Tous les champs sont obligatoires.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setApiError('Les mots de passe ne correspondent pas.');
            return;
        }

        if (!code) {
            setApiError('Code de réinitialisation manquant.');
            return;
        }

        try {
            setIsLoading(true);
            const res = await resetPassword(code, newPassword);
            setApiSuccess(res.message || 'Mot de passe réinitialisé avec succès.');
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setApiError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="auth-header" style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '36px', color: '#1a00b2', fontWeight: 800 }}>Nouveau mot de passe</h2>
                <p style={{ fontSize: '16px', color: '#000', marginTop: '10px' }}>
                    Entrez votre nouveau mot de passe.
                </p>
            </div>
            <form onSubmit={handleSubmit} style={{ marginTop: '30px', padding: '0 20px' }}>
                {apiError && <div className="api-error-banner">{apiError}</div>}
                {apiSuccess && <div className="api-error-banner" style={{ backgroundColor: '#d4edda', color: '#155724', border: '1px solid #c3e6cb', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>{apiSuccess}</div>}

                <div className="form-group">
                    <label style={{ fontSize: '18px', fontWeight: 'bold' }}>Nouveau mot de passe :</label>
                    <input
                        type="password"
                        placeholder="Nouveau mot de passe"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        style={{ padding: '15px' }}
                    />
                </div>
                <div className="form-group" style={{ marginTop: '20px' }}>
                    <label style={{ fontSize: '18px', fontWeight: 'bold' }}>Confirmer mot de passe :</label>
                    <input
                        type="password"
                        placeholder="Confirmer mot de passe"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        style={{ padding: '15px' }}
                    />
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px' }}>
                    <button type="submit" className="submit-btn" disabled={isLoading} style={{ width: '80%', padding: '15px', borderRadius: '30px', backgroundColor: '#1a00b2', fontSize: '20px' }}>
                        {isLoading ? 'Enregistrement...' : 'Réinitialiser'}
                    </button>
                </div>
            </form>
            <div className="auth-footer" style={{ marginTop: '30px', fontSize: '18px' }}>
                <Link to="/login"><span className="auth-link" style={{ fontSize: '18px' }}>Retour à la connexion</span></Link>
            </div>
        </>
    );
};

export default ResetPassword;
