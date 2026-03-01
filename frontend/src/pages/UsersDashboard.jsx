import React, { useEffect, useState } from 'react';
import { getAllUsers, updateUserStatus, updateUserRole, deleteUser } from '../services/userService';
import { PieChart, Search, Check, X, Eye, Trash2, Edit2 } from 'lucide-react';

const UsersDashboard = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await getAllUsers();
            setUsers(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleStatusChange = async (id, newStatus) => {
        try {
            await updateUserStatus(id, newStatus);
            fetchUsers(); // Re-fetch to update table
        } catch (err) {
            alert(err.message);
        }
    };

    const handleRoleChange = async (id, currentRole) => {
        const newRole = currentRole === 'ADMIN' ? 'ADHERENT' : 'ADMIN';
        if (window.confirm(`Voulez-vous vraiment changer le rôle en ${newRole} ?`)) {
      try {
        await updateUserRole(id, newRole);
        fetchUsers();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur définitivement ?")) {
      try {
        await deleteUser(id);
        fetchUsers();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const filteredUsers = users.filter((user) =>
    user.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8">
      {/* Top Section */}
      <div className="flex flex-col xl:flex-row justify-between items-start gap-8 mb-8">
        {/* Placeholder Chart Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm w-full xl:w-1/3 border-4 border-blue-300 flex items-center justify-center gap-6">
          <div className="w-24 h-24 rounded-full border-8 border-t-red-500 border-r-blue-600 border-b-yellow-400 border-l-blue-600"></div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2"><div className="w-12 h-3 bg-blue-600"></div><div className="w-16 h-3 bg-gray-200"></div></div>
            <div className="flex items-center gap-2"><div className="w-8 h-3 bg-red-500"></div><div className="w-20 h-3 bg-gray-200"></div></div>
            <div className="flex items-center gap-2"><div className="w-16 h-3 bg-yellow-400"></div><div className="w-12 h-3 bg-gray-200"></div></div>
            <div className="flex items-center gap-2"><div className="w-14 h-3 bg-blue-600"></div><div className="w-14 h-3 bg-gray-200"></div></div>
            <div className="flex items-center gap-2"><div className="w-10 h-3 bg-red-500"></div><div className="w-18 h-3 bg-gray-200"></div></div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col items-end gap-4 w-full xl:w-2/3">
          <h2 className="text-xl font-medium text-gray-800">Recherche par nom, email..</h2>
          <div className="flex items-center gap-4 w-full justify-end">
            <div className="relative w-full max-w-md">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="w-5 h-5 text-gray-400" />
              </span>
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 border border-gray-400 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Recherche..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-full font-medium shadow-md transition-colors">
              Filtrer
            </button>
          </div>
          <div className="flex gap-4">
            <button className="border border-green-500 text-green-600 hover:bg-green-50 px-6 py-2 rounded-full font-medium transition-colors">
              Actif
            </button>
            <button className="border border-red-500 text-red-600 hover:bg-red-50 px-6 py-2 rounded-full font-medium transition-colors">
              Refusé
            </button>
            <button className="bg-gray-300 text-gray-700 hover:bg-gray-400 px-6 py-2 rounded-full font-medium shadow-inner transition-colors">
              En attente
            </button>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="bg-[#1f29b7] text-white px-6 py-3">
          <h2 className="text-xl font-semibold">Gestion Utilisateurs</h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-gray-500">Chargement des données...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#e6f0fa] text-[#1f29b7] text-sm font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4 border-b border-gray-200">Matricule</th>
                  <th className="px-6 py-4 border-b border-gray-200">Utilisateur</th>
                  <th className="px-6 py-4 border-b border-gray-200">Email</th>
                  <th className="px-6 py-4 border-b border-gray-200">Rôle</th>
                  <th className="px-6 py-4 border-b border-gray-200">Statut</th>
                  <th className="px-6 py-4 border-b border-gray-200 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                      {user.matricule || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      <div className="bg-gray-200 bg-opacity-70 px-4 py-1.5 rounded-full inline-block">
                        {user.nom} {user.prenom}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <button 
                        onClick={() => handleRoleChange(user.id, user.role)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {user.role} <Edit2 size={12} className="inline ml-1 mb-0.5" />
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.statut === 1 ? (
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm flex items-center w-fit gap-1">
                          Actif
                        </span>
                      ) : user.statut === 2 ? (
                        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm flex items-center w-fit gap-1">
                          Refusé
                        </span>
                      ) : (
                        <select 
                          value={user.statut}
                          onChange={(e) => handleStatusChange(user.id, parseInt(e.target.value))}
                          className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm border-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        >
                          <option value={0}>En attente</option>
                          <option value={1}>Actif</option>
                          <option value={2}>Refusé</option>
                        </select>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-3">
                        {user.statut !== 1 && (
                          <button 
                            onClick={() => handleStatusChange(user.id, 1)}
                            className="text-green-500 hover:text-green-700 transition-colors"
                            title="Accepter"
                          >
                            <Check size={24} strokeWidth={3} />
                          </button>
                        )}
                        {user.statut !== 2 && (
                          <button 
                            onClick={() => handleStatusChange(user.id, 2)}
                            className="text-red-400 hover:text-red-600 transition-colors"
                            title="Refuser"
                          >
                            <X size={24} strokeWidth={3} />
                          </button>
                        )}
                        <button 
                          className="text-black hover:text-gray-600 transition-colors"
                          title="Détails"
                        >
                          <Eye size={24} strokeWidth={2.5} />
                        </button>
                        <button 
                          onClick={() => handleDelete(user.id)}
                          className="text-gray-500 hover:text-red-600 transition-colors ml-2"
                          title="Supprimer"
                        >
                          <Trash2 size={20} strokeWidth={2} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && !loading && (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      Aucun utilisateur trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersDashboard;
