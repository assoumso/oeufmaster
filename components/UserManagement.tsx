import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { ShieldCheck, User, Trash2, Edit2, Check, X, AlertTriangle } from 'lucide-react';
import { db } from '../services/firebase';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';

interface UserManagementProps {
  currentUserUid: string;
}

const UserManagement: React.FC<UserManagementProps> = ({ currentUserUid }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [roleDraft, setRoleDraft] = useState<UserRole>('SELLER');

  useEffect(() => {
    const q = query(collection(db, "users"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as UserProfile[];
      setUsers(usersData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleUpdateRole = async (uid: string) => {
    try {
      await updateDoc(doc(db, "users", uid), { role: roleDraft });
      setEditingId(null);
    } catch (e) {
      alert("Erreur lors de la mise à jour du rôle.");
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (uid === currentUserUid) {
      alert("Vous ne pouvez pas supprimer votre propre compte.");
      return;
    }
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ? Il ne pourra plus accéder à l'application.")) {
      try {
        await deleteDoc(doc(db, "users", uid));
        // Note: Cela supprime le profil Firestore. Pour supprimer l'authentification Firebase Auth, 
        // cela nécessite idéalement le SDK Admin ou une Cloud Function, mais supprimer le profil bloque l'accès dans App.tsx
      } catch (e) {
        alert("Erreur lors de la suppression.");
      }
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN': return <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-bold">Administrateur</span>;
      case 'SELLER': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">Vendeur</span>;
      case 'ACCOUNTANT': return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold">Comptable</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">Inconnu</span>;
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement des utilisateurs...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <ShieldCheck className="text-egg-600" /> Gestion des Utilisateurs
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Gérez les employés ayant accès à l'application et leurs permissions.
        </p>

        <div className="overflow-hidden border border-gray-200 rounded-xl">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-6 py-4">Utilisateur</th>
                <th className="px-6 py-4">Rôle</th>
                <th className="px-6 py-4">Date création</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.uid} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                        <User size={20} />
                      </div>
                      <div>
                        <div className="font-bold text-gray-800">{user.email.replace('@barakasoft.com', '')}</div>
                        <div className="text-xs text-gray-400">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {editingId === user.uid ? (
                      <select 
                        value={roleDraft}
                        onChange={(e) => setRoleDraft(e.target.value as UserRole)}
                        className="border border-gray-300 rounded p-1 text-sm bg-white"
                      >
                        <option value="SELLER">Vendeur</option>
                        <option value="ACCOUNTANT">Comptable</option>
                        <option value="ADMIN">Administrateur</option>
                      </select>
                    ) : (
                      getRoleBadge(user.role)
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {editingId === user.uid ? (
                        <>
                          <button 
                            onClick={() => handleUpdateRole(user.uid)}
                            className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                            title="Sauvegarder"
                          >
                            <Check size={16} />
                          </button>
                          <button 
                            onClick={() => setEditingId(null)}
                            className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                            title="Annuler"
                          >
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={() => { setEditingId(user.uid); setRoleDraft(user.role); }}
                          className="p-2 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-lg transition-colors"
                          title="Modifier le rôle"
                        >
                          <Edit2 size={16} />
                        </button>
                      )}
                      
                      <button 
                        onClick={() => handleDeleteUser(user.uid)}
                        disabled={user.uid === currentUserUid}
                        className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Supprimer l'utilisateur"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 text-blue-800 rounded-xl flex items-start gap-3 text-sm">
           <AlertTriangle size={20} className="shrink-0 mt-0.5" />
           <div>
             <span className="font-bold">Comment ajouter un utilisateur ?</span>
             <p className="mt-1 text-blue-700/80">
               Pour ajouter un employé, demandez-lui de créer un compte via la page de connexion (bouton "Créer un accès").
               Par défaut, il sera <strong>Vendeur</strong>. Revenez ensuite ici pour modifier son rôle si nécessaire.
             </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;