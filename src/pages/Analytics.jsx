import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../lib/axios';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { 
  Download, Wallet, ArrowUpRight, ArrowDownRight, Globe, MoreHorizontal, Calendar, CreditCard, ChevronDown 
} from 'lucide-react';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [stats, setStats] = useState({
    total_revenue: 0,
    net_profit: 0,
    available_balance: 0,
    total_bookings: 0,
    active_users: 0
  });

  const [chartData, setChartData] = useState([]);
  const [demographicsData, setDemographicsData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [deviceData, setDeviceData] = useState([]);

  // Withdrawal Modal State
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/admin/analytics');
      const { cards, chart, demographics, categories, device_stats } = res.data;
      
      setStats({
        total_revenue: cards.total_revenue,
        net_profit: cards.net_profit,
        available_balance: cards.available_balance,
        total_bookings: cards.total_bookings,
        active_users: cards.total_users,
      });

      setChartData(chart || []);
      setDemographicsData(demographics || []);
      setCategoryData(categories || []);
      setDeviceData(device_stats || []);

    } catch (error) {
      console.error("Error fetching analytics", error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if(!withdrawAmount || isNaN(withdrawAmount) || parseFloat(withdrawAmount) <= 0) {
      return alert("Enter a valid amount");
    }

    if(parseFloat(withdrawAmount) > stats.available_balance) {
      return alert("Insufficient funds. You cannot withdraw more than your available profit.");
    }

    setIsWithdrawing(true);
    try {
      await api.post('/admin/withdraw', {
        amount: parseFloat(withdrawAmount),
        destination: 'Main Bank Account'
      });
      
      alert(`Success! $${withdrawAmount} withdrawn.`);
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      fetchAnalytics(); 
    } catch (error) {
      alert("Withdrawal failed: " + (error.response?.data?.error || "Unknown error"));
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex h-screen items-center justify-center text-[#89273B]">
          Loading Analytics...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Track Overview</h1>
          <p className="text-gray-500 text-sm mt-1">Track your revenue, user behavior, and top-performing sources.</p>
        </div>
        <div className="flex gap-4">
          <button className="px-6 py-3 border border-gray-200 bg-white rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2">
            <Download size={18} /> View Reports
          </button>
          <button 
            onClick={() => setShowWithdrawModal(true)}
            className="px-6 py-3 bg-[#89273B] text-white rounded-xl text-sm font-semibold shadow-lg shadow-red-900/20 hover:bg-[#722030] flex items-center gap-2"
          >
            <Wallet size={18} /> Withdraw Funds
          </button>
        </div>
      </div>

      {/* === TOP CARDS ROW === */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 mb-8">
        <MetricCard label="Total Revenue" value={`$${stats.total_revenue.toLocaleString()}`} color="border-purple-500" badge="Gross" />
        <MetricCard label="Net Profit" value={`$${stats.net_profit.toLocaleString()}`} color="border-green-500" badge="20%" />
        <MetricCard label="Available" value={`$${stats.available_balance.toLocaleString()}`} color="border-blue-500" badge="Wallet" />
        <MetricCard label="Total Bookings" value={stats.total_bookings} color="border-yellow-500" badge="Total" />
        <MetricCard label="Active Users" value={stats.active_users} color="border-red-400" badge="Total" />
      </div>

      <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 lg:gap-6 mb-8">
        
        {/* === MAIN TRAFFIC CHART (Left) === */}
        {/* FIX 1: Added min-w-0 to prevent flex width issues */}
        <div className="flex-[2] bg-white rounded-3xl p-4 sm:p-6 lg:p-8 shadow-sm border border-gray-100 min-w-0">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-gray-800">Traffic & Revenue</h3>
              <p className="text-sm text-gray-400">Profit vs Bookings (Last 6 Months)</p>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg text-sm text-gray-600 font-medium">
                Last 6 Months <ChevronDown size={16}/>
              </button>
            </div>
          </div>

          <div className="h-[300px] w-full">
            {/* FIX 2: Only render Chart if data exists */}
            {chartData && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    cursor={{ stroke: '#89273B', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Line type="monotone" dataKey="revenue" name="Profit ($)" stroke="#89273B" strokeWidth={3} dot={{ r: 4, fill: '#89273B', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="bookings" name="Bookings" stroke="#D4AF37" strokeWidth={3} dot={false} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <p>No revenue data available yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* === RIGHT SIDE (Platform Stats) === */}
        {/* FIX 1: Added min-w-0 */}
        <div className="flex-1 bg-white rounded-3xl p-4 sm:p-6 lg:p-8 shadow-sm border border-gray-100 flex flex-col justify-between min-w-0">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Users</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats.active_users.toLocaleString()}</h3>
            </div>
            <span className="bg-green-50 text-green-500 text-xs px-2 py-1 rounded-md font-medium">Live</span>
          </div>

          <div className="h-40 w-full mb-6 relative">
             {/* FIX 2: Check for data before render */}
             {chartData && chartData.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#89273B" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#89273B" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="revenue" stroke="#89273B" fillOpacity={1} fill="url(#colorPv)" />
                  </AreaChart>
               </ResponsiveContainer>
             ) : (
               <div className="h-full flex items-center justify-center text-xs text-gray-300 border border-dashed rounded-xl">No Chart Data</div>
             )}
          </div>

          <div className="space-y-6">
            {deviceData.map((item, index) => (
               <div key={index} className="flex items-center justify-between border-b border-gray-50 pb-4 last:border-0">
                  <span className="text-sm font-medium text-gray-600">{item.name}</span>
                  <div className="text-right">
                    <span className="block font-bold text-gray-900">{item.value} Users</span>
                  </div>
               </div>
            ))}
            {deviceData.length === 0 && <p className="text-sm text-gray-400 text-center">No device data found.</p>}
          </div>
        </div>
      </div>

      {/* === BOTTOM SECTION === */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        
        {/* 1. DEMOGRAPHICS (Map List) */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 lg:p-8 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800">Demographics</h3>
            <button><MoreHorizontal size={20} className="text-gray-400"/></button>
          </div>
          
          <div className="w-full h-32 bg-gray-100 rounded-xl mb-6 flex items-center justify-center text-gray-400 text-sm">
             [ Map Visual Placeholder ]
          </div>

          <div className="space-y-4">
             {demographicsData.length > 0 ? demographicsData.map((item, idx) => (
               <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🌍</span>
                    <span className="text-sm font-medium text-gray-700">{item.country}</span>
                  </div>
                  <span className="font-bold text-gray-900">{item.users.toLocaleString()}</span>
               </div>
             )) : (
                <p className="text-sm text-gray-400">No user location data available.</p>
             )}
          </div>
        </div>

        {/* 2. CATEGORY BREAKDOWN */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 lg:p-8 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-gray-800">Service Breakdown</h3>
          </div>
          
          <div className="flex items-center justify-center h-48 relative">
             {/* FIX 2: Check for data */}
             {categoryData && categoryData.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={categoryData}
                     innerRadius={60}
                     outerRadius={80}
                     paddingAngle={5}
                     dataKey="value"
                   >
                     {categoryData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.color} />
                     ))}
                   </Pie>
                   <Tooltip />
                 </PieChart>
               </ResponsiveContainer>
             ) : (
                <div className="text-gray-400 text-sm">No services found</div>
             )}
             
             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs text-gray-400 font-medium">Services</span>
                <span className="text-xl font-bold text-gray-900">{categoryData.reduce((a,b)=>a+b.value,0)}</span>
             </div>
          </div>

          <div className="space-y-3 mt-4 overflow-y-auto max-h-[120px] scrollbar-hide">
             {categoryData.map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                   <div className="flex items-center gap-2">
                       <div className="w-3 h-3 rounded-full" style={{backgroundColor: cat.color}}></div> 
                       <span className="truncate w-24">{cat.name}</span>
                   </div>
                   <span className="font-bold">{cat.value}</span>
                </div>
             ))}
          </div>
        </div>

        {/* 3. INFO CARD */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 lg:p-8 shadow-sm border border-gray-100 flex flex-col text-center items-center justify-center">
           <div className="w-full h-32 mb-6 relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-24 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
              <div className="absolute top-0 left-1/4 w-24 h-24 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
              <div className="absolute top-8 left-1/3 w-24 h-24 bg-pink-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
              <img src="https://cdn-icons-png.flaticon.com/512/3063/3063822.png" alt="Analytics" className="w-24 h-24 relative z-10 mx-auto object-contain" />
           </div>
           
           <h3 className="text-lg font-bold text-gray-900 mb-2">Understand Your Data</h3>
           <p className="text-sm text-gray-500 mb-6 leading-relaxed">
             Profit is calculated as 20% of total revenue. Available balance is Profit minus Withdrawals.
           </p>
           <button className="text-[#89273B] font-semibold text-sm hover:underline">Read Documentation</button>
        </div>
      </div>

      {/* === WITHDRAWAL MODAL === */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-4 sm:p-6 lg:p-8 w-[90%] sm:w-[400px] shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-4 mb-6">
               <div className="p-3 bg-[#FDF0F3] rounded-full text-[#89273B]">
                 <Wallet size={24} />
               </div>
               <div>
                 <h2 className="text-xl font-bold text-gray-900">Withdraw Funds</h2>
                 <p className="text-sm text-gray-500">Transfer earnings to bank.</p>
               </div>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Amount (USD)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">$</span>
                <input 
                  type="number" 
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-4 py-3 text-lg font-bold text-gray-800 focus:outline-none focus:border-[#89273B] focus:ring-1 focus:ring-[#89273B]"
                  placeholder="0.00"
                  autoFocus
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Available to Withdraw: <span className="font-bold text-green-600">${(stats.available_balance).toLocaleString()}</span>
              </p>
            </div>

            <div className="mb-6 bg-blue-50 p-4 rounded-xl flex gap-3">
               <CreditCard className="text-blue-600 shrink-0" size={20} />
               <div>
                 <p className="text-xs font-bold text-blue-800 uppercase">Destination</p>
                 <p className="text-sm text-blue-700 font-medium">Chase Bank **** 4829</p>
               </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowWithdrawModal(false)}
                className="flex-1 py-3 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleWithdraw}
                disabled={isWithdrawing}
                className="flex-1 py-3 bg-[#89273B] text-white rounded-xl font-medium hover:bg-[#722030] shadow-lg shadow-red-900/20 disabled:opacity-70"
              >
                {isWithdrawing ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
};

// Component for the Top 5 Cards
const MetricCard = ({ label, value, color, badge }) => (
  <div className={`bg-white rounded-3xl p-6 shadow-sm border border-gray-100 border-t-4 ${color}`}>
    <div className="flex items-center gap-2 mb-4">
      <div className={`w-2 h-2 rounded-full ${color.replace('border-', 'bg-')}`}></div>
      <span className="text-sm font-medium text-gray-500">{label}</span>
    </div>
    <h3 className="text-3xl font-bold text-gray-900 mb-2">{value}</h3>
    <span className="inline-block px-2 py-1 bg-green-50 text-green-600 text-xs font-bold rounded-lg">{badge}</span>
  </div>
);

export default Analytics;