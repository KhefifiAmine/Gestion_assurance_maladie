import { API_BASE, handleResponse } from './api';

/**
 * Trigger a manual database backup (POST /api/backups)
 */
export const triggerBackup = async () => {
    const res = await fetch(`${API_BASE}/backups`, {
        method: 'POST',
        credentials: 'include'
    });
    return handleResponse(res);
};

/**
 * List all available database backups (GET /api/backups)
 */
export const fetchBackups = async () => {
    const res = await fetch(`${API_BASE}/backups`, {
        credentials: 'include'
    });
    return handleResponse(res);
};

/**
 * Download a backup file by filename.
 * Opens a browser download via a temporary anchor element.
 */
export const downloadBackup = (filename) => {
    const url = `${API_BASE}/backups/${encodeURIComponent(filename)}`;
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    return fetch(url, { credentials: 'include' })
        .then(res => {
            if (!res.ok) throw new Error('Téléchargement échoué');
            return res.blob();
        })
        .then(blob => {
            const blobUrl = URL.createObjectURL(blob);
            link.href = blobUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
        });
};

/**
 * Delete a backup file by filename (DELETE /api/backups/:filename)
 */
export const deleteBackup = async (filename) => {
    const res = await fetch(`${API_BASE}/backups/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
        credentials: 'include'
    });
    return handleResponse(res);
};
