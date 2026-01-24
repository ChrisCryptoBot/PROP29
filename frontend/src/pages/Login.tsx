import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-hot-toast';
import { Button } from '../components/UI/Button';

const Login: React.FC = () => {
  const { login, loading } = useAuth();
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    if (emailRef.current) {
      emailRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!credentials.email || !credentials.password) {
      toast.error('Please fill in all fields');
      return;
    }

    const success = await login(credentials);
    if (success) {
      // Login successful - AuthContext will handle the redirect
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const fillDemoCredentials = () => {
    setCredentials({
      email: 'admin@proper.com',
      password: 'admin123'
    });
    toast.success('Demo credentials filled!');
  };

  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="grid grid-cols-5 min-h-screen">
        <section className="col-span-3 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900" />
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.25),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(59,130,246,0.35),transparent_40%),radial-gradient(circle_at_50%_80%,rgba(15,23,42,0.6),transparent_55%)]" />
          <div className="relative z-10 h-full flex flex-col justify-center px-16">
            <div className="max-w-2xl space-y-6">
              <div className="w-20 h-20 rounded-2xl bg-white/10 border border-white/20 backdrop-blur flex items-center justify-center shadow-2xl">
                <span className="text-white text-2xl font-bold tracking-tight">P2.9</span>
              </div>
              <div>
                <h1 className="text-5xl font-semibold tracking-tight text-white">
                  Proper 2.9 Security Console
                </h1>
                <p className="mt-3 text-lg text-white/80">
                  AI-Enhanced Security Management Platform
                </p>
              </div>
              <div className="text-sm text-white/70">
                Secure access for authorized security personnel only.
              </div>
            </div>
          </div>
        </section>

        <section className="col-span-2 bg-slate-950 flex flex-col justify-between px-12 py-14">
          <div className="max-w-md w-full">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.25em] text-blue-400">Security Console</p>
              <h2 className="text-3xl font-semibold text-white">Sign in</h2>
              <p className="text-sm text-slate-400">
                Enter your secure credentials to continue.
              </p>
            </div>

            <div
              className={`mt-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                }`}
            >
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div
                  className={`relative rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl p-6 shadow-2xl ${loading ? 'ring-2 ring-blue-500/50 shadow-[0_0_35px_rgba(59,130,246,0.35)] animate-pulse' : ''
                    }`}
                >
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-slate-200 mb-2">
                        Email / ID
                      </label>
                      <input
                        ref={emailRef}
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        disabled={loading}
                        className="w-full rounded-lg bg-white/5 border border-white/10 text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 shadow-[0_0_0_1px_rgba(59,130,246,0.15)] placeholder:text-slate-500"
                        placeholder="security@proper.com"
                        value={credentials.email}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-slate-200 mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          id="password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          required
                          disabled={loading}
                          className="w-full rounded-lg bg-white/5 border border-white/10 text-white px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 shadow-[0_0_0_1px_rgba(59,130,246,0.15)] placeholder:text-slate-500"
                          placeholder="••••••••••"
                          value={credentials.password}
                          onChange={handleChange}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-400 transition-colors"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          disabled={loading}
                        >
                          <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                        </button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? 'Signing in...' : 'Sign in'}
                    </Button>
                  </div>
                </div>

                {isDevelopment && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={fillDemoCredentials}
                    className="w-full border-white/20 text-slate-200 hover:bg-white/10"
                  >
                    <i className="fas fa-key mr-2" />
                    Fill Demo Credentials
                  </Button>
                )}

                <div className="text-xs text-slate-500 space-y-1">
                  <p>Demo credentials: admin@proper.com / admin123</p>
                  <p>(Also accepts: admin@proper29.com or admin)</p>
                </div>
              </form>
            </div>
          </div>

          <div className="text-xs text-slate-500">
            <div className="uppercase tracking-[0.2em] text-slate-400">Proper 2.9 Stable Build</div>
            <div className="mt-2 space-y-1">
              <div>
                Status: <span className="text-green-400">Connection Secure</span>
              </div>
              <div>
                Network: <span className="text-green-400">Encrypted</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Login; 
