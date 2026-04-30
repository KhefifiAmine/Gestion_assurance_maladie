import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE } from "../../services/api";

const ACTION_LABELS = {
    // Authentification
    'POST sur /api/auth/login': { label: 'Connexion', icon: '🔑', color: '#22c55e', bg: '#f0fdf4' },
    'POST sur /api/auth/logout': { label: 'Déconnexion', icon: '🚪', color: '#f97316', bg: '#fff7ed' },
    
    // Profil utilisateur
    'PUT sur /api/profile': { label: 'Modification du profil', icon: '👤', color: '#3b82f6', bg: '#eff6ff' },
    'GET sur /api/profile': { label: 'Consultation du profil', icon: '👁️', color: '#6366f1', bg: '#eef2ff' },
    
    // Bulletins
    'POST sur /api/bulletins': { label: 'Création d\'un bulletin', icon: '📝', color: '#8b5cf6', bg: '#f5f3ff' },
    'PUT sur /api/bulletins': { label: 'Modification d\'un bulletin', icon: '✏️', color: '#06b6d4', bg: '#ecfeff' },
    'DELETE sur /api/bulletins': { label: 'Suppression d\'un bulletin', icon: '🗑️', color: '#ef4444', bg: '#fef2f2' },
    'PATCH sur /api/bulletins': { label: 'Mise à jour statut bulletin', icon: '🔄', color: '#f59e0b', bg: '#fffbeb' },
    
    // Réclamations
    'POST sur /api/reclamations': { label: 'Création d\'une réclamation', icon: '📋', color: '#ec4899', bg: '#fdf2f8' },
    'PUT sur /api/reclamations': { label: 'Modification d\'une réclamation', icon: '✏️', color: '#d946ef', bg: '#faf5ff' },
    'DELETE sur /api/reclamations': { label: 'Suppression d\'une réclamation', icon: '🗑️', color: '#ef4444', bg: '#fef2f2' },
    
    // Bénéficiaires
    'POST sur /api/beneficiaries': { label: 'Ajout d\'un bénéficiaire', icon: '➕', color: '#10b981', bg: '#ecfdf5' },
    'PUT sur /api/beneficiaries': { label: 'Modification d\'un bénéficiaire', icon: '✏️', color: '#14b8a6', bg: '#f0fdfa' },
    'DELETE sur /api/beneficiaries': { label: 'Suppression d\'un bénéficiaire', icon: '🗑️', color: '#ef4444', bg: '#fef2f2' },
    
    // Notifications
    'PUT sur /api/notifications/read-all': { label: 'Lecture des notifications', icon: '🔔', color: '#64748b', bg: '#f8fafc' },
    'PUT sur /api/notifications': { label: 'Mise à jour notification', icon: '🔔', color: '#94a3b8', bg: '#f1f5f9' },
    
    // Utilisateurs (Admin)
    'PUT sur /api/users': { label: 'Modification d\'un utilisateur', icon: '👥', color: '#0ea5e9', bg: '#f0f9ff' },
    'DELETE sur /api/users': { label: 'Suppression d\'un utilisateur', icon: '🚫', color: '#dc2626', bg: '#fef2f2' },
    'PATCH sur /api/users': { label: 'Blocage/Déblocage utilisateur', icon: '🔒', color: '#f97316', bg: '#fff7ed' },
    
    // Stats
    'GET sur /api/stats': { label: 'Consultation des statistiques', icon: '📊', color: '#0891b2', bg: '#ecfeff' },
    
    // Logs
    'GET sur /api/logs': { label: 'Consultation du journal', icon: '📋', color: '#6b7280', bg: '#f9fafb' },
};

const getToken = () => localStorage.getItem('token');

const fetchLogs = async (filters) => {
    const params = new URLSearchParams();
    if (filters.action) params.append('action', filters.action);
    if (filters.userId) params.append('userId', filters.userId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    params.append('page', filters.page);
    params.append('limit', filters.limit);

    const res = await fetch(`${API_BASE}/logs?${params.toString()}`, {
        headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json'
        }
    });
    if (!res.ok) throw new Error('Erreur lors du chargement des logs');
    return res.json();
};

const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
};

const getActionLabel = (action) => {
    // Chercher une correspondance exacte
    if (ACTION_LABELS[action]) {
        return ACTION_LABELS[action];
    }
    
    // Chercher une correspondance partielle
    for (const [key, value] of Object.entries(ACTION_LABELS)) {
        if (action && action.includes(key.split('sur')[0].trim())) {
            return value;
        }
    }
    
    // Fallback pour les actions inconnues
    return { 
        label: action || 'Action inconnue', 
        icon: '📌', 
        color: '#6b7280', 
        bg: '#f9fafb' 
    };
};

const ActionBadge = ({ action }) => {
    const info = getActionLabel(action);
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>{info.icon}</span>
            <span style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                color: info.color,
                background: info.bg,
                border: `1px solid ${info.color}30`,
                letterSpacing: '0.3px',
                whiteSpace: 'nowrap'
            }}>
                {info.label}
            </span>
        </div>
    );
};

export default function LogsPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const [filters, setFilters] = useState({
        action: '',
        userId: '',
        startDate: '',
        endDate: '',
        page: 1,
        limit: 20
    });

    const loadLogs = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchLogs(filters);
            setLogs(data.logs);
            setTotal(data.total);
            setTotalPages(data.totalPages);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        loadLogs();
    }, [loadLogs]);

    const handleFilterChange = (e) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value, page: 1 }));
    };

    const handleReset = () => {
        setFilters({ action: '', userId: '', startDate: '', endDate: '', page: 1, limit: 20 });
    };

    const handlePageChange = (newPage) => {
        setFilters(prev => ({ ...prev, page: newPage }));
    };

    return (
        <div style={{ padding: '24px', fontFamily: "'Segoe UI', system-ui, sans-serif", background: '#f8fafc', minHeight: '100vh' }}>
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '28px' }}>📋</span>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                        Journal d'activité
                    </h1>
                </div>
                <p style={{ color: '#64748b', marginTop: '4px', fontSize: '14px', marginLeft: '40px' }}>
                    Historique détaillé de toutes les actions effectuées sur la plateforme
                </p>
            </div>

            {/* Filters */}
            <div style={{
                background: '#fff',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
                border: '1px solid #e2e8f0'
            }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
                    {/* Filtre action */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Action</label>
                        <select
                            name="action"
                            value={filters.action}
                            onChange={handleFilterChange}
                            style={selectStyle}
                        >
                            <option value="">Toutes les actions</option>
                            {Object.entries(ACTION_LABELS).map(([key, val]) => (
                                <option key={key} value={key}>{val.icon} {val.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Filtre userId */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>ID Utilisateur</label>
                        <input
                            type="number"
                            name="userId"
                            value={filters.userId}
                            onChange={handleFilterChange}
                            placeholder="Ex: 42"
                            style={inputStyle}
                        />
                    </div>

                    {/* Date début */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Date début</label>
                        <input
                            type="date"
                            name="startDate"
                            value={filters.startDate}
                            onChange={handleFilterChange}
                            style={inputStyle}
                        />
                    </div>

                    {/* Date fin */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Date fin</label>
                        <input
                            type="date"
                            name="endDate"
                            value={filters.endDate}
                            onChange={handleFilterChange}
                            style={inputStyle}
                        />
                    </div>

                    {/* Bouton reset */}
                    <button 
                        onClick={handleReset} 
                        style={resetBtnStyle}
                        onMouseEnter={e => { e.target.style.background = '#f1f5f9'; e.target.style.borderColor = '#94a3b8'; }}
                        onMouseLeave={e => { e.target.style.background = '#fff'; e.target.style.borderColor = '#cbd5e1'; }}
                    >
                        ↺ Réinitialiser
                    </button>
                </div>
            </div>

            {/* Stats bar */}
            <div style={{ 
                marginBottom: '16px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
            }}>
                {!loading && !error && (
                    <span style={{ fontSize: '13px', color: '#64748b' }}>
                        <strong style={{ color: '#1e293b' }}>{total}</strong> entrée{total > 1 ? 's' : ''} trouvée{total > 1 ? 's' : ''}
                    </span>
                )}
                {!loading && !error && (
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                        Page {filters.page} sur {totalPages || 1}
                    </span>
                )}
            </div>

            {/* Table */}
            <div style={{
                background: '#fff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
                overflow: 'hidden'
            }}>
                {loading ? (
                    <div style={{ padding: '80px', textAlign: 'center' }}>
                        <div style={{ fontSize: '40px', marginBottom: '16px', animation: 'spin 1s linear infinite' }}>⏳</div>
                        <div style={{ color: '#64748b', fontSize: '14px' }}>Chargement du journal d'activité...</div>
                    </div>
                ) : error ? (
                    <div style={{ padding: '60px', textAlign: 'center' }}>
                        <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
                        <div style={{ color: '#ef4444', fontWeight: 500, marginBottom: '8px' }}>Erreur de chargement</div>
                        <div style={{ color: '#64748b', fontSize: '13px' }}>{error}</div>
                    </div>
                ) : logs.length === 0 ? (
                    <div style={{ padding: '80px', textAlign: 'center' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                        <div style={{ color: '#64748b', fontWeight: 500, marginBottom: '4px' }}>Aucune activité enregistrée</div>
                        <div style={{ color: '#94a3b8', fontSize: '13px' }}>Les actions effectuées sur la plateforme apparaîtront ici</div>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                <th style={{ ...thStyle, width: '60px' }}>#</th>
                                <th style={thStyle}>Action</th>
                                <th style={{ ...thStyle, width: '140px' }}>Utilisateur</th>
                                <th style={{ ...thStyle, width: '130px' }}>Adresse IP</th>
                                <th style={{ ...thStyle, width: '170px' }}>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log, idx) => (
                                <tr 
                                    key={log.id_log} 
                                    style={{
                                        borderBottom: '1px solid #f1f5f9',
                                        transition: 'all 0.2s ease',
                                        background: idx % 2 === 0 ? '#fff' : '#fafafa'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
                                    onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#fafafa'}
                                >
                                    <td style={{ ...tdStyle, textAlign: 'center', width: '60px' }}>
                                        <span style={{ 
                                            color: '#94a3b8', 
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            background: '#f1f5f9',
                                            padding: '2px 8px',
                                            borderRadius: '6px'
                                        }}>
                                            #{log.id_log}
                                        </span>
                                    </td>
                                    <td style={tdStyle}>
                                        <ActionBadge action={log.action} />
                                    </td>
                                    <td style={{ ...tdStyle, width: '140px' }}>
                                        <div style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            background: '#f1f5f9',
                                            borderRadius: '8px',
                                            padding: '4px 10px',
                                            fontSize: '13px',
                                            fontWeight: 500,
                                            color: '#475569'
                                        }}>
                                            <span style={{ fontSize: '14px' }}>👤</span>
                                            <span>ID: {log.userId}</span>
                                        </div>
                                    </td>
                                    <td style={{ ...tdStyle, width: '130px' }}>
                                        <code style={{ 
                                            fontSize: '12px', 
                                            color: '#64748b',
                                            background: '#f8fafc',
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            fontFamily: 'monospace'
                                        }}>
                                            {log.adresse_ip || '—'}
                                        </code>
                                    </td>
                                    <td style={{ ...tdStyle, width: '170px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ fontSize: '14px' }}>🕐</span>
                                            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
                                                {formatDate(log.createdAt)}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && !loading && (
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    gap: '12px', 
                    marginTop: '24px',
                    padding: '16px 0'
                }}>
                    <button
                        onClick={() => handlePageChange(filters.page - 1)}
                        disabled={filters.page === 1}
                        style={pageBtnStyle(filters.page === 1)}
                    >
                        ← Précédent
                    </button>
                    
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 16px',
                        background: '#fff',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        fontSize: '13px',
                        color: '#64748b'
                    }}>
                        <span>Page</span>
                        <strong style={{ color: '#1e293b', fontSize: '14px' }}>{filters.page}</strong>
                        <span>sur</span>
                        <strong style={{ color: '#1e293b', fontSize: '14px' }}>{totalPages}</strong>
                    </div>

                    <button
                        onClick={() => handlePageChange(filters.page + 1)}
                        disabled={filters.page === totalPages}
                        style={pageBtnStyle(filters.page === totalPages)}
                    >
                        Suivant →
                    </button>
                </div>
            )}

            {/* Footer */}
            {!loading && !error && logs.length > 0 && (
                <div style={{ 
                    textAlign: 'center', 
                    marginTop: '16px', 
                    padding: '12px',
                    fontSize: '11px',
                    color: '#94a3b8'
                }}>
                    Affichage de {logs.length} entrée{logs.length > 1 ? 's' : ''} sur {total} au total
                </div>
            )}
        </div>
    );
}

// ─── Styles ───────────────────────────────────────────────

const inputStyle = {
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    color: '#1e293b',
    background: '#f8fafc',
    outline: 'none',
    minWidth: '140px',
    transition: 'all 0.2s ease'
};

const selectStyle = {
    ...inputStyle,
    minWidth: '220px',
    cursor: 'pointer',
    appearance: 'none',
    WebkitAppearance: 'none',
    backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23475569\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 8px center',
    backgroundSize: '16px',
    paddingRight: '32px'
};

const resetBtnStyle = {
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    background: '#fff',
    color: '#475569',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
};

const thStyle = {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    background: '#f8fafc'
};

const tdStyle = {
    padding: '14px 16px',
    fontSize: '13px',
    color: '#1e293b',
    verticalAlign: 'middle'
};

const pageBtnStyle = (disabled) => ({
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    background: disabled ? '#f8fafc' : '#fff',
    color: disabled ? '#94a3b8' : '#1e293b',
    fontSize: '13px',
    fontWeight: 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    transition: 'all 0.2s ease'
});