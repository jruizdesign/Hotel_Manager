import { useState } from 'react';
import { Shield } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (password: string) => void;
  error: string | null;
  isLoading: boolean;
}

const LoginScreen = ({ onLogin, error, isLoading }: LoginScreenProps) => {
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(password);
  };

  return (
    <div className="h-screen w-screen bg-slate-100 flex items-center justify-center font-sans">
      <div className="w-full max-w-xs">
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-xl px-8 pt-6 pb-8 mb-4">
          
          <div className="text-center mb-6">
              <img src="/logo.svg" alt="StaySync Logo" className="w-24 h-24 mx-auto mb-2" />
              <h1 className="text-3xl font-bold text-slate-800">StaySync</h1>
              <p className="text-slate-500">Hotel Management</p>
          </div>

          <div className="mb-4">
            <label className="block text-slate-700 text-sm font-bold mb-2" htmlFor="password">
              Master Password
            </label>
            <input
              className="shadow-sm appearance-none border border-slate-300 rounded-lg w-full py-3 px-4 text-slate-700 leading-tight focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              id="password"
              type="password"
              placeholder="******************"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}

          <div className="flex items-center justify-between">
            <button
              className="bg-emerald-600 hover:bg-emerald-700 w-full text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors disabled:bg-slate-400"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Unlocking...' : 'Unlock'}
            </button>
          </div>
        </form>
        
        <div className="text-center text-slate-500 text-xs">
           <div className="text-slate-600/80 text-[10px] text-center font-semibold uppercase tracking-[0.2em]">
             <p className="flex items-center justify-center gap-2">
               <Shield size={10} className="text-slate-700" /> StaySync Security Framework v4.2
             </p>
             <p className="mt-2 opacity-40">Architected by Jason Ruiz • Global Terminal Auth</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
