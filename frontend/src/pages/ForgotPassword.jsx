import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPassword } from '../services/api';
import './Auth.css';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [apiError, setApiError] = useState('');
    const [apiSuccess, setApiSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setApiError('');
        setApiSuccess('');

        if (!email) {
            setApiError('Veuillez entrer une adresse email valide.');
            return;
        }

        try {
            setIsLoading(true);
            const res = await forgotPassword(email);
            setApiSuccess(res.message || 'Si un compte existe, un email a été envoyé.');
            setTimeout(() => {
                navigate('/verify-reset-code');
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
                <h2 style={{ fontSize: '36px', color: '#1a00b2', fontWeight: 800 }}>Mot de passe oublié</h2>
                <p style={{ fontSize: '16px', color: '#000', marginTop: '10px' }}>
                    Entrez votre adresse email pour recevoir un code de réinitialisation.
                </p>
            </div>
            <form onSubmit={handleSubmit} style={{ marginTop: '30px', padding: '0 20px' }}>
                {apiError && <div className="api-error-banner">{apiError}</div>}
                {apiSuccess && <div className="api-error-banner" style={{ backgroundColor: '#d4edda', color: '#155724', border: '1px solid #c3e6cb', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>{apiSuccess}</div>}

                <div className="form-group">
                    <label style={{ fontSize: '18px', fontWeight: 'bold' }}>Email :</label>
                    <input
                        type="email"
                        placeholder="Entrer votre Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{ padding: '15px' }}
                    />
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px' }}>
                    <button type="submit" className="submit-btn" disabled={isLoading} style={{ width: '80%', padding: '15px', borderRadius: '30px', backgroundColor: '#1a00b2', fontSize: '20px' }}>
                        {isLoading ? 'Envoi...' : 'Recevoir le code'}
                    </button>
                </div>
            </form>
            <div className="auth-footer" style={{ marginTop: '30px', fontSize: '18px' }}>
                <Link to="/login"><span className="auth-link" style={{ fontSize: '18px' }}>Retour à la connexion</span></Link>
            </div>
        </>
    );
};

export default ForgotPassword;
