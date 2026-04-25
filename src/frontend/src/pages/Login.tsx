import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  const handleSetup = () => {
    navigate('/setup/welcome');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex w-full">
      {/* Left Side Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-8 relative z-10">
        <div className="w-full max-w-[400px]">
          <h1 className="text-white font-bold text-sm tracking-widest mb-16 uppercase">
            Pulseo ERP
          </h1>

          <div className="mb-8">
            <h2 className="text-[3.5rem] font-serif text-zinc-100 mb-4 leading-none">
              Log in
            </h2>
            <p className="text-zinc-400 text-xs tracking-wide">
              Se você é paciente, Click <a href="#" className="underline hover:text-white transition-colors">Aqui</a>
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-zinc-500" />
              </div>
              <input
                type="email"
                required
                placeholder="seu.email@clinica.com"
                className="w-full pl-12 pr-4 py-3.5 bg-transparent border border-zinc-700/80 rounded-full text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-zinc-500" />
              </div>
              <input
                type="password"
                required
                placeholder="Password"
                className="w-full pl-12 pr-4 py-3.5 bg-transparent border border-zinc-700/80 rounded-full text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>

            <div className="flex items-center justify-between px-2 pt-1 pb-4">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="w-4 h-4 rounded border-zinc-700 bg-[#3b42fc] text-[#3b42fc] focus:ring-[#3b42fc] focus:ring-offset-0 focus:ring-offset-transparent cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-xs text-zinc-400 cursor-pointer">
                  Remember Me
                </label>
              </div>
              <a href="#" className="text-xs text-zinc-400 hover:text-white transition-colors">
                Forget <span className="text-zinc-200 font-medium">Password ?</span>
              </a>
            </div>

            <div className="space-y-4">
              <button
                type="submit"
                className="w-full py-3.5 px-4 bg-[#3b42fc] hover:bg-[#2d33d9] text-white rounded-full text-sm font-medium transition-all shadow-[0_0_15px_rgba(59,66,252,0.4)]"
              >
                Log In
              </button>

              <button
                type="button"
                onClick={handleSetup}
                className="w-full py-3.5 px-4 bg-transparent border border-zinc-700 hover:bg-zinc-800 text-zinc-300 rounded-full text-sm font-medium transition-colors flex items-center justify-center gap-3"
              >
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-4 h-4" />
                Log In With Google
              </button>
            </div>
          </form>
          
          <p className="text-center text-xs text-zinc-500 mt-8">
            If you don't have an account, click <button onClick={handleSetup} className="text-zinc-200 hover:text-white font-medium transition-colors">Sign up</button>
          </p>
        </div>
      </div>
      
      {/* Right Side Image */}
      <div className="hidden md:block w-1/2 relative bg-black overflow-hidden border-l border-zinc-900">
         <img 
            src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=2034&auto=format&fit=crop" 
            alt="Data Center"
            className="w-full h-full object-cover scale-105"
            style={{ filter: 'hue-rotate(180deg) brightness(0.8) contrast(1.2) saturation(1.5)' }}
         />
         {/* Overlays to make it look sci-fi */}
         <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-transparent to-transparent"></div>
         <div className="absolute inset-0 bg-indigo-900/20 mix-blend-overlay"></div>
      </div>
    </div>
  );
}
