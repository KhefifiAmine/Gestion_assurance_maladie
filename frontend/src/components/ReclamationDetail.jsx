import React from 'react';
import AdminReclamationDetail from './AdminReclamationDetail';
import AdherentReclamationDetail from './AdherentReclamationDetail';

/**
 * Composant de redirection (Dispatcher) pour les détails de réclamation.
 * Redirige vers la vue Admin ou Adhérent selon le rôle.
 */
const ReclamationDetail = (props) => {
  const { userRole } = props;

  if (userRole === 'ADMIN' || userRole === 'RESPONSABLE_RH') {
    return <AdminReclamationDetail {...props} />;
  }

  return <AdherentReclamationDetail {...props} />;
};

export default ReclamationDetail;
