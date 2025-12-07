import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Calendar, BarChart3, CreditCard, MessageSquare, Settings, LogOut, Search, Bell, Moon, Menu, X as CloseIcon, PieChart } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../lib/axios';
import logo from '../assets/logo.png';

const SidebarItem = ({ icon: Icon, label, path, badge, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === path || (path === '/' && location.pathname === '/dashboard');

  return (
    <div 
      onClick={onClick} 
      className={`flex items-center justify-between px-4 py-3 mb-1 cursor-pointer rounded-xl transition-all duration-200 group ${
        isActive 
          ? 'bg-[#89273B] text-white shadow-lg shadow-red-900/10' 
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon size={20} className={isActive ? "text-white" : "text-gray-400 group-hover:text-gray-600"} />
        <span className="font-medium text-sm">{label}</span>
      </div>
      {badge && (
        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-red-50 text-[#89273B]'}`}>
          {badge}
        </span>
      )}
    </div>
  );
};

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // 1. Initialize from LocalStorage (Instant visual)
  const [currentUser, setCurrentUser] = useState(() => {
    const userStr = localStorage.getItem('admin_user');
    return userStr ? JSON.parse(userStr).user_metadata || JSON.parse(userStr) : {};
  });

  // 2. Fetch Latest Profile on Mount (Syncs visual with Database)
  useEffect(() => {
    const syncProfile = async () => {
      try {
        const res = await api.get('/users/profile');
        if (res.data && res.data.profile) {
          const freshData = res.data.profile;
          setCurrentUser(freshData); // Update UI
          
          // Update Storage
          const stored = localStorage.getItem('admin_user');
          if (stored) {
            const parsed = JSON.parse(stored);
            // Merge the fresh profile into user_metadata or the root object
            const updated = { ...parsed, user_metadata: { ...parsed.user_metadata, ...freshData } };
            localStorage.setItem('admin_user', JSON.stringify(updated));
          }
        }
      } catch (error) {
        // Silent fail - just keep showing what we have in storage
        console.warn("Could not sync header profile");
      }
    };
    syncProfile();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleNavigation = (path) => {
    navigate(path);
    setIsSidebarOpen(false);
  };

  // 3. Robust Image Logic
  const userName = currentUser?.full_name || 'Admin User';
  const profilePic = currentUser?.profile_picture_url 
    ? currentUser.profile_picture_url 
    : `https://ui-avatars.com/api/?name=${userName}&background=89273B&color=fff`;

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-gray-800">
      
      {/* MOBILE OVERLAY */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${
          isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsSidebarOpen(false)}
      />

     
        <aside 
          className={`fixed top-0 left-0 w-64 h-full bg-white border-r border-gray-100 flex flex-col p-6 z-50 transition-transform duration-300 ease-in-out lg:translate-x-0
            ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
          `}
        >
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-2">
          <img src={logo} alt="LifeKit Logo" className="w-8 h-8" />
          <span className="text-2xl font-bold tracking-tight text-[#89273B]">LifeKit</span>
            </div>
            <button 
          onClick={() => setIsSidebarOpen(false)} 
          className="lg:hidden p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
          <CloseIcon size={20} />
            </button>
          </div>

          <div className="space-y-1 flex-1 overflow-y-auto scrollbar-hide">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-4 px-4">Main Menu</p>
            <SidebarItem icon={LayoutDashboard} label="Dashboard" path="/" onClick={() => handleNavigation('/')} />
            <SidebarItem icon={Calendar} label="Events" path="/events" onClick={() => handleNavigation('/events')} />
            <SidebarItem icon={BarChart3} label="Activities" path="/activities" onClick={() => handleNavigation('/activities')} />
            <SidebarItem icon={CreditCard} label="Transactions" path="/transactions" onClick={() => handleNavigation('/transactions')} />
            
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-8 mb-4 px-4">Features</p>
            <SidebarItem icon={PieChart} label="Deep Analysis" path="/analysis" onClick={() => handleNavigation('/analysis')} />
            <SidebarItem icon={MessageSquare} label="Feedback" path="/feedback" onClick={() => handleNavigation('/feedback')} />
          </div>

          <div className="space-y-1 mt-auto pt-4 border-t border-gray-50">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-4 px-4">Account</p>
            <SidebarItem icon={Settings} label="Settings" path="/settings" onClick={() => handleNavigation('/settings')} />
            <SidebarItem icon={MessageSquare} label="Feeds" path="/feeds" onClick={() => handleNavigation('/feeds')} />
            <SidebarItem icon={LogOut} label="Logout" onClick={handleLogout} />
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
      <main className="lg:pl-64 w-full min-h-screen flex flex-col transition-all duration-300">
        
        {/* HEADER */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="lg:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-bold text-gray-800 hidden sm:block">Admin Panel</h1>
          </div>
          
          <div className="flex items-center gap-4 lg:gap-6">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search..." 
                className="pl-10 pr-4 py-2.5 bg-gray-50 rounded-full text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[#89273B]/20 transition-all border border-transparent focus:border-[#89273B]/10" 
              />
            </div>
            
            <div className="flex items-center gap-2">
              <button className="p-2.5 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"><Moon size={20} /></button>
              <button className="p-2.5 rounded-full hover:bg-gray-100 text-gray-500 transition-colors relative">
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
              </button>
            </div>
            
            <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>

            <div className="flex items-center gap-3 pl-2">
              <img 
                src={profilePic} 
                alt="Admin" 
                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm bg-gray-50"
                onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${userName}&background=89273B&color=fff`; }}
              />
              <div className="hidden lg:block leading-tight">
                <p className="text-sm font-bold text-gray-800">{userName}</p>
                <p className="text-xs text-gray-500 font-medium">Super Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <div className="p-6 lg:p-8 flex-1 overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;