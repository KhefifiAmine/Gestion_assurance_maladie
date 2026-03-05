import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { verifyResetCode } from '../services/api';
import './Auth.css';

const VerifyResetCode = () => {
    const [code, setCode] = useState('');
    const [apiError, setApiError] = useState('');
    const [apiSuccess, setApiSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setApiError('');
        setApiSuccess('');

        if (!code || code.length !== 6) {
            setApiError('Veuillez entrer un code valide à 6 chiffres.');
            return;
        }

        try {
            setIsLoading(true);
            const res = await verifyResetCode(code);
            setApiSuccess(res.message || 'Code vérifié avec succès.');
            // On transmit the code to the next page using location state
            setTimeout(() => {
                navigate('/reset-password', { state: { code } });
            }, 1000);
        } catch (err) {
            setApiError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="auth-header" style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '36px', color: '#1a00b2', fontWeight: 800 }}>Vérification du code</h2>
                <p style={{ fontSize: '16px', color: '#000', marginTop: '10px' }}>
                    Entrez le code à 6 chiffres que vous avez reçu par email.
                </p>
            </div>
            <form onSubmit={handleSubmit} style={{ marginTop: '30px', padding: '0 20px' }}>
                {apiError && <div className="api-error-banner">{apiError}</div>}
                {apiSuccess && <div className="api-error-banner" style={{ backgroundColor: '#d4edda', color: '#155724', border: '1px solid #c3e6cb', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>{apiSuccess}</div>}

                <div className="form-group">
                    <label style={{ fontSize: '18px', fontWeight: 'bold' }}>Code de réinitialisation :</label>
                    <input
                        type="text"
                        placeholder="000000"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        required
                        style={{ padding: '15px', letterSpacing: '4px', textAlign: 'center', fontSize: '20px' }}
                        maxLength="6"
                    />
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px' }}>
                    <button type="submit" className="submit-btn" disabled={isLoading} style={{ width: '80%', padding: '15px', borderRadius: '30px', backgroundColor: '#1a00b2', fontSize: '20px' }}>
                        {isLoading ? 'Vérification...' : 'Vérifier'}
                    </button>
                </div>
            </form>
            <div className="auth-footer" style={{ marginTop: '30px', fontSize: '18px' }}>
                <Link to="/login"><span className="auth-link" style={{ fontSize: '18px' }}>Retour à la connexion</span></Link>
            </div>
        </>
    );
};

export default VerifyResetCode;
