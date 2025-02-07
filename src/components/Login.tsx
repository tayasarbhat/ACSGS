import React, { useState } from 'react';
import { FileSpreadsheet, Lock } from 'lucide-react';

interface LoginProps {
  onLogin: (password: string) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    onLogin(password);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto w-fit p-4 glass rounded-2xl mb-6">
            <FileSpreadsheet size={48} className="text-primary" />
          </div>
          <h2 className="text-3xl font-bold gradient-text mb-2">
            Google Sheets Manager
          </h2>
          <p className="text-white/60">
            Enter your password to access the dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass p-8 rounded-2xl space-y-6">
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-white/80">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40" size={20} />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl
                  focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-white 
                  placeholder-white/40 transition-all duration-200"
                placeholder="Enter password"
                required
                autoFocus
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-primary hover:bg-primary-dark disabled:opacity-50
              text-white font-medium rounded-xl transition-all duration-200
              hover:shadow-lg hover:shadow-primary/20 disabled:hover:shadow-none
              flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Login to Dashboard</span>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-white/40">
          © 2025 Google Sheets Manager. All rights reserved.
        </p>
      </div>
    </div>
  );
}