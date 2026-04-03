import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, Facebook } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate('/');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        
        {/* Social Login Section */}
        <div className="space-y-3">
          <button className="w-full bg-[#1877F2] text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg">
            <Facebook size={20} fill="white" /> Continuer avec Facebook
          </button>
          <button className="w-full bg-black text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.39-1.09-.52-2.05-.51-3.14 0-1.45.69-2.22.56-3.13-.39C5.1 17.65 4.3 12.3 6.33 9.07c1.1-1.74 2.85-2.8 4.67-2.8 1.4 0 2.45.6 3.4.6.9 0 2.25-.75 3.8-.6 1.6.15 2.85.8 3.55 2.05-3.35 1.95-2.8 6.15.55 7.6-.75 1.95-1.75 3.85-2.5 5.25zM12.03 6.35c-.15-2.55 1.85-4.7 4.15-4.8.3 2.85-2.25 5.15-4.15 4.8z"/></svg>
            Continuer avec Apple
          </button>
        </div>

        <div className="text-center">
          <p className="text-[#facc15] text-xs flex items-center justify-center gap-1">
            <ShieldCheck size={14} /> Connexion sécurisée — aucun mot de passe stocké
          </p>
        </div>

        <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-700"></div>
            <span className="flex-shrink mx-4 text-slate-500 text-xs font-bold uppercase">ou par email</span>
            <div className="flex-grow border-t border-slate-700"></div>
        </div>

        {/* Email Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Adresse e-mail</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#1e293b] border border-slate-700 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="votre@email.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Mot de passe</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#1e293b] border border-slate-700 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Votre mot de passe"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3.5 text-slate-500 hover:text-white"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all"
          >
            Se connecter
          </button>
        </form>

        <div className="flex flex-col items-center gap-4 text-sm font-medium">
          <Link to="/inscription" className="text-blue-500">Créer un compte</Link>
          <Link to="/reset-password" className="text-blue-500">Mot de passe oublié ?</Link>
          <Link to="/activation-createur" className="text-[#f97316] text-xs">✨ Vous êtes le propriétaire ? Activez votre accès Créateur →</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
