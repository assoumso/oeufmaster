import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { Lock, User, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    executeAuth(username, password, isSignUp);
  };

  const executeAuth = async (user: string, pass: string, createAccount: boolean) => {
    setLoading(true);
    setError(null);

    let emailToUse = user.trim();
    if (!emailToUse.includes('@')) {
        emailToUse = `${emailToUse}@barakasoft.com`;
    }

    try {
      if (createAccount) {
        await createUserWithEmailAndPassword(auth, emailToUse, pass);
      } else {
        await signInWithEmailAndPassword(auth, emailToUse, pass);
      }
    } catch (err: any) {
      // Si on essaie de créer un compte qui existe déjà -> On tente de se connecter
      if (err.code === 'auth/email-already-in-use' && createAccount) {
         setIsSignUp(false); // On bascule l'interface sur Connexion
         try {
             await signInWithEmailAndPassword(auth, emailToUse, pass);
             return; // Succès de la connexion automatique
         } catch (loginErr: any) {
             // Le compte existe, mais le mot de passe fourni est faux
             setError(`Le compte '${user}' existe déjà. Veuillez entrer le mot de passe pour vous connecter.`);
         }
      } 
      // Erreurs classiques de connexion
      else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        if (!createAccount) {
            setError("Identifiants incorrects. Si vous n'avez pas de compte, cliquez sur 'Créer un accès'.");
        } else {
            setError("Impossible de créer le compte.");
        }
      } else if (err.code === 'auth/weak-password') {
        setError("Le mot de passe doit faire au moins 6 caractères.");
      } else if (err.code === 'auth/operation-not-allowed') {
        setError("ACTION REQUISE : Activez 'Email/Password' dans la Console Firebase > Authentication.");
      } else if (err.code === 'auth/invalid-email') {
        setError("Nom d'utilisateur invalide (évitez les espaces et caractères spéciaux).");
      } else if (err.code === 'auth/too-many-requests') {
        setError("Trop de tentatives. Veuillez patienter ou réinitialiser votre mot de passe.");
      } else {
        // On ne loggue pas les erreurs gérées pour garder la console propre
        console.error("Auth error:", err.code);
        setError("Une erreur est survenue: " + (err.message || "Erreur inconnue"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDefaultAdmin = () => {
      const defUser = 'admin';
      const defPass = '123456';
      setUsername(defUser);
      setPassword(defPass);
      // Tente de créer, si existe -> tente de connecter via la logique du catch
      executeAuth(defUser, defPass, true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-egg-500 p-8 text-center transition-all duration-300">
          <div className="w-16 h-16 bg-white rounded-2xl mx-auto flex items-center justify-center text-egg-600 font-bold text-3xl shadow-lg mb-4">
            Œ
          </div>
          <h1 className="text-2xl font-bold text-white">ŒufMaster Pro</h1>
          <p className="text-egg-100 text-sm">Gestion commerciale avicole</p>
        </div>

        {/* Form */}
        <div className="p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">
            {isSignUp ? "Créer un compte" : "Connexion"}
          </h2>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-center gap-3 text-red-700 text-sm animate-pulse">
              <AlertCircle size={20} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom d'utilisateur</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-egg-500 focus:border-egg-500 outline-none transition-all"
                  placeholder="Ex: admin"
                  autoCapitalize="none"
                  autoCorrect="off"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-egg-500 focus:border-egg-500 outline-none transition-all"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-egg-600 hover:bg-egg-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-egg-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {loading ? <Loader2 className="animate-spin" /> : (isSignUp ? "S'inscrire" : "Se connecter")}
            </button>
          </form>

          {/* Bouton d'initialisation rapide pour le user */}
          {!isSignUp && (
             <button 
                type="button"
                onClick={handleCreateDefaultAdmin}
                className="w-full mt-4 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-3 rounded-xl border border-gray-200 flex items-center justify-center gap-2 text-xs uppercase tracking-wide"
             >
                <ShieldCheck size={16} /> Initialiser l'Admin par défaut
             </button>
          )}

          <div className="mt-6 text-center">
             <button 
               type="button"
               onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
               className="text-egg-600 font-bold text-sm hover:underline flex items-center justify-center gap-1 mx-auto"
             >
               {isSignUp ? (
                 <>Déjà un compte ? Se connecter</>
               ) : (
                 <>Pas encore de compte ? Créer un accès</>
               )}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;