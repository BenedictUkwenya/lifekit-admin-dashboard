import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { DollarSign, ShoppingBag, Users, Activity, X, Search, Filter } from 'lucide-react';
import api from '../lib/axios';
import { format } from 'date-fns';

const StatCard = ({ icon: Icon, label, value, colorClass }) => (
  <div className={`p-4 sm:p-6 rounded-2xl ${colorClass}`}>
    <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
      <div className="p-2 bg-white/30 rounded-lg backdrop-blur-sm">
        <Icon size={20} className="sm:size-6 text-gray-800" />
      </div>
      <span className="font-medium text-xs sm:text-sm text-gray-700 line-clamp-2">{label}</span>
    </div>
    <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{value}</h3>
    <p className="text-xs text-gray-600 bg-white/40 inline-block px-2 py-1 rounded-md">
      Live Data
    </p>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // NEW: State for rejection reason
  const [rejectReason, setRejectReason] = useState("");

  // Time-based Greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning!';
    if (hour < 18) return 'Good Afternoon!';
    return 'Good Evening!';
  };

  const currentDate = format(new Date(), 'EEEE, MMMM d');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, servicesRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/services-queue')
      ]);
      setStats(statsRes.data);
      setServices(servicesRes.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewAction = async (status) => {
    if (!selectedService) return;
    try {
      // Send status AND reason to backend
      await api.put(`/admin/review-service/${selectedService.id}`, { 
        status, 
        reason: rejectReason 
      });
      
      // Cleanup UI
      setSelectedService(null);
      setRejectReason(""); 
      fetchData(); // Refresh list
    } catch (error) {
      console.error("Review action failed:", error);
      alert("Failed to update status");
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center text-[#89273B]">Loading Dashboard...</div>;

  return (
    <Layout>
      <div className="mb-8">
        <p className="text-gray-500 text-sm mb-1">{currentDate}</p>
        <h2 className="text-3xl font-bold text-gray-800">{getGreeting()} Admin</h2>
      </div>

      {/* Banner - Responsive */}
      <div className="relative w-full h-32 sm:h-40 lg:h-48 bg-[#F3E8E8] rounded-2xl sm:rounded-3xl overflow-hidden mb-6 sm:mb-10 flex items-center px-4 sm:px-8 lg:px-10">
        <div className="absolute -left-20 top-0 bottom-0 w-60 bg-[#89273B] skew-x-12"></div>

        <div className="absolute left-8 sm:left-20 top-4 bottom-4 w-1 bg-[#d6adad]"></div>
        <div className="relative z-10 sm:ml-20 w-full sm:w-auto">
          <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Connect With A Larger Team</h3>
          <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-4 line-clamp-2">Add or remove admin profile from dashboard.</p>
          <button className="text-[#89273B] font-semibold flex items-center gap-2 hover:underline text-xs sm:text-sm">Learn more <span>→</span></button>
        </div>
      </div>

      {/* Stats Cards - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-10">
        <StatCard icon={DollarSign} label="Total Revenue" value={`$${stats?.total_revenue?.toLocaleString() || '0'}`} colorClass="bg-[#F9E3E3]" />
        <StatCard icon={ShoppingBag} label="Total Bookings" value={stats?.total_bookings || '0'} colorClass="bg-[#E3E6F9]" />
        <StatCard icon={Activity} label="Pending Reviews" value={stats?.pending_reviews || '0'} colorClass="bg-[#F9F3E3]" />
        <StatCard icon={Users} label="Total Users" value={stats?.total_users || '0'} colorClass="bg-[#E3F9E9]" />
      </div>

      {/* Table - Responsive */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <h3 className="text-lg sm:text-xl font-bold text-gray-800">Recent Services Request</h3>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input type="text" placeholder="Search..." className="pl-10 pr-4 py-2 bg-gray-50 rounded-lg text-xs sm:text-sm w-full sm:w-64 border border-gray-100 focus:outline-none focus:border-[#89273B]" />
            </div>
            <button className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 rounded-lg text-xs sm:text-sm font-medium text-gray-600 hover:bg-gray-100 whitespace-nowrap">
              <Filter size={16} /> <span className="hidden sm:inline">Sort by</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-xs sm:text-sm">
              <thead>
                <tr className="text-left text-gray-500 text-xs sm:text-sm border-b border-gray-100">
                  <th className="pb-3 sm:pb-4 font-medium pl-2 sm:pl-4">Service ID</th>
                  <th className="pb-3 sm:pb-4 font-medium hidden sm:table-cell">Date</th>
                  <th className="pb-3 sm:pb-4 font-medium">Provider</th>
                  <th className="pb-3 sm:pb-4 font-medium hidden lg:table-cell">Category</th>
                  <th className="pb-3 sm:pb-4 font-medium hidden md:table-cell">Service</th>
                  <th className="pb-3 sm:pb-4 font-medium">Status</th>
                  <th className="pb-3 sm:pb-4 font-medium hidden sm:table-cell">Ref</th>
                </tr>
              </thead>
              <tbody className="text-xs sm:text-sm">
                {services.map((item) => (
                  <tr key={item.id} onClick={() => setSelectedService(item)} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors group">
                    <td className="py-3 sm:py-4 pl-2 sm:pl-4 font-medium text-gray-900 group-hover:text-[#89273B] truncate">
                       LYF{item.id.substring(0, 4).toUpperCase()}
                    </td>
                    <td className="py-3 sm:py-4 text-gray-600 hidden sm:table-cell whitespace-nowrap">{format(new Date(item.created_at), 'd MMM yyyy')}</td>
                    <td className="py-3 sm:py-4 text-gray-600 truncate max-w-[150px]">
  {item.profiles?.full_name || 'Unknown'}
</td>

                    <td className="py-3 sm:py-4 text-gray-600 hidden lg:table-cell">{item.service_categories?.name || 'General'}</td>
                    <td className="py-3 sm:py-4 text-gray-600 hidden md:table-cell truncate max-w-[200px]">
  {item.title}
</td>

                    <td className="py-3 sm:py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(item.status)}`}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 sm:py-4 text-gray-500 text-xs hidden sm:table-cell">#{item.id.substring(0, 6)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      </div>

      {/* Slide-Over Panel - Responsive */}
      <div className={`fixed inset-y-0 right-0 w-full sm:w-[400px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${selectedService ? 'translate-x-0' : 'translate-x-full'}`}>
        {selectedService && (
          <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <h3 className="text-lg sm:text-xl font-bold">Review Service</h3>
              <button onClick={() => setSelectedService(null)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20}/></button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <img 
                src={Array.isArray(selectedService.image_urls) ? (Array.isArray(selectedService.image_urls[0]) ? selectedService.image_urls[0][0] : selectedService.image_urls[0]) : 'https://via.placeholder.com/400x200'} 
                alt="Service" 
                className="w-full h-48 object-cover rounded-xl mb-6"
                onError={(e) => {e.target.src = 'https://via.placeholder.com/400x200'}}
              />
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 font-medium uppercase">Service Title</label>
                  <p className="text-lg font-semibold">{selectedService.title}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-medium uppercase">Price</label>
                  <p className="text-lg font-semibold text-[#89273B]">${selectedService.price} / hr</p>
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-medium uppercase">Provider</label>
                  <p className="font-medium">{selectedService.profiles?.full_name}</p>
                </div>
                
                {/* REJECTION REASON INPUT */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <label className="text-xs text-gray-400 font-medium uppercase">Review Notes</label>
                  <textarea
                    className="w-full mt-2 p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#89273B]"
                    rows="3"
                    placeholder="If rejecting, please specify the reason here..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex gap-4">
              <button 
                onClick={() => handleReviewAction('rejected')}
                className="flex-1 py-3 border border-red-200 text-red-600 rounded-xl font-medium hover:bg-red-50 transition-colors"
              >
                Reject
              </button>
              <button 
                onClick={() => handleReviewAction('active')}
                className="flex-1 py-3 bg-[#89273B] text-white rounded-xl font-medium hover:bg-[#722030] transition-colors shadow-lg shadow-red-900/20"
              >
                Approve & Active
              </button>
            </div>
          </div>
        )}
      </div>
      
      {selectedService && (
        <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setSelectedService(null)}></div>
      )}
    </Layout>
  );
};

export default Dashboard;