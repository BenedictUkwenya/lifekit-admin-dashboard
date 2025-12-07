import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Activity } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (localStorage.getItem('admin_token')) navigate('/');
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', formData);
      const { user, session, profile } = response.data;

      // Role Check
      if (profile?.role !== 'admin') {
        setError("Access Denied. Administrator privileges required.");
        setLoading(false);
        return;
      }

      // Save Credentials
      localStorage.setItem('admin_token', session.access_token);
      // Merge Auth metadata with Profile data for a complete user object
      const userData = { ...user, user_metadata: { ...user.user_metadata, ...profile } };
      localStorage.setItem('admin_user', JSON.stringify(userData));

      navigate('/', { replace: true });
      
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-white">
      
      {/* LEFT SIDE: Visuals (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 bg-[#89273B] relative overflow-hidden flex-col justify-between p-12 text-white">
        {/* Logo and Branding */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
             <div className="absolute top-[-20%] left-[-20%] w-[800px] h-[800px] rounded-full border-[100px] border-white/20"></div>
             <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-white/10 blur-3xl"></div>
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <img src="/src/assets/logo2.png" alt="LifeKit Logo" className="w-10 h-10" />
              <span className="text-2xl font-bold tracking-tight">LifeKit</span>
            </div>
            <h1 className="text-5xl font-bold leading-tight mb-6">Manage your services with total control.</h1>
            <p className="text-xl text-white/80 max-w-md">Monitor analytics, manage bookings, and control users from one powerful dashboard.</p>
          </div>

          <div className="relative z-10 flex gap-8">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"><ShieldCheck size={20}/></div>
                <span className="font-medium">Secure Access</span>
             </div>
             <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"><Activity size={20}/></div>
                <span className="font-medium">Real-time Data</span>
             </div>
          </div>
              </div>

              {/* RIGHT SIDE: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50 lg:bg-white">
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
            <p className="text-gray-500 mt-2">Please enter your details to sign in.</p>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3 text-red-700 text-sm font-medium animate-in zoom-in-95">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Email Address</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#89273B] transition-colors">
                  <Mail size={20} />
                </div>
                <input 
                  type="email" 
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#89273B] focus:ring-4 focus:ring-[#89273B]/10 transition-all font-medium text-gray-800"
                  placeholder="admin@lifekit.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-gray-700">Password</label>
                <button type="button" className="text-xs font-semibold text-[#89273B] hover:underline">Forgot Password?</button>
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#89273B] transition-colors">
                  <Lock size={20} />
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#89273B] focus:ring-4 focus:ring-[#89273B]/10 transition-all font-medium text-gray-800"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#89273B] text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-[#89273B]/20 hover:bg-[#722030] hover:shadow-2xl hover:shadow-[#89273B]/30 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>Sign in <ArrowRight size={20} /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400">
            Protected by LifeKit Admin Security
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;