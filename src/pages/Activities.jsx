import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../lib/axios';
import { format } from 'date-fns';
import { Calendar, Search, Filter, MoreVertical, CheckCircle, X, BarChart as BarChartIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CHART_COLORS = ['#7B2CBF', '#D4AF37', '#0013DE', '#12B823', '#89273B'];

const Activities = () => {
  // --- STATE ---
  const [chartData, setChartData] = useState([]);
  const [chartPeriod, setChartPeriod] = useState('monthly');
  const [pendingServices, setPendingServices] = useState([]); 
  const [selectedReview, setSelectedReview] = useState(null); 
  const [services, setServices] = useState([]); 
  const [selectedService, setSelectedService] = useState(null); 
  const [isLoading, setIsLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState("");

  // --- FETCH DATA ---
  useEffect(() => {
    fetchData();
  }, [chartPeriod]);

  const fetchData = async () => {
    try {
      const [chartRes, queueRes] = await Promise.all([
        api.get(`/admin/activities/chart?period=${chartPeriod}`),
        api.get('/admin/services-queue')
      ]);

      setChartData(chartRes.data || []);
      setServices(queueRes.data); 
      const pending = queueRes.data.filter(s => s.status === 'pending');
      setPendingServices(pending);

    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- HANDLERS ---
  const handleReviewAction = async (itemToReview, status) => {
    if (!itemToReview) return;
    try {
      await api.put(`/admin/review-service/${itemToReview.id}`, { status, reason: rejectReason });
      alert(`Service ${status}`);
      setRejectReason("");
      setSelectedReview(null);
      setSelectedService(null);
      fetchData(); 
    } catch (error) {
      alert("Action failed");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const renderImage = (url) => {
    if (url && Array.isArray(url) && url.length > 0) return url[0];
    if (url && typeof url === 'string') return url;
    return null;
  };

  return (
    <Layout>
      {/* WRAPPER: Force full width */}
      <div className="w-full">
        
        <div className="mb-4 lg:mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Activities</h1>
        </div>

        {/* === TOP SECTION === */}
        {/* Responsive: Stack on mobile, row on lg+ */}
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 mb-6 lg:mb-8 w-full">
          
          {/* 1. CHART CARD */}
          {/* Responsive: Full width on mobile, flex-1 on lg+ */}
          <div className="flex-1 w-full bg-white rounded-2xl lg:rounded-3xl p-4 lg:p-8 shadow-sm border border-gray-100 flex flex-col min-h-[350px] lg:min-h-[500px]">
            <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between mb-4 lg:mb-6 gap-2">
              <h2 className="text-lg lg:text-xl font-bold text-gray-800">Listed Services</h2>
              <div className="flex gap-2 w-full sm:w-auto">
                <select 
                  value={chartPeriod}
                  onChange={(e) => setChartPeriod(e.target.value)}
                  className="bg-gray-50 border-none text-xs lg:text-sm font-medium text-gray-600 py-2 px-3 lg:px-4 rounded-lg lg:rounded-xl cursor-pointer focus:ring-0 outline-none flex-1 sm:flex-none"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
                <button className="p-2 bg-gray-50 rounded-lg lg:rounded-xl text-gray-600"><Calendar size={16} className="lg:size-5" /></button>
              </div>
            </div>

            <div className="w-full flex-1 overflow-hidden">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barSize={Math.min(48, 30)}>
                    <Tooltip 
                      cursor={{fill: '#f3f4f6'}} 
                      contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}} 
                    />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#9CA3AF'}} dy={10} />
                    <Bar dataKey="value" radius={[12, 12, 12, 12]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <BarChartIcon size={36} className="lg:size-12 mb-2 lg:mb-3 opacity-20" />
                  <p className="font-medium text-xs lg:text-base">No data available</p>
                  <p className="text-xs opacity-60">Services will appear here</p>
                </div>
              )}
            </div>
          </div>

          {/* 2. TOP RIGHT REVIEW CARD */}
          {/* Responsive: Full width on mobile, flex-1 on lg+ */}
          <div className="flex-1 w-full bg-white rounded-2xl lg:rounded-3xl p-4 lg:p-8 shadow-sm border border-gray-100 flex flex-col relative min-h-[350px] lg:min-h-[500px]">
            {pendingServices.length > 0 ? (
              <>
                <div className="flex items-start justify-between mb-6">
                  <div className="min-w-0">
                    <p className="text-sm text-gray-500 mb-1">{pendingServices[0].profiles?.full_name}</p>
                    <h2 className="text-2xl font-bold text-gray-900 line-clamp-1">{pendingServices[0].title}</h2>
                    <p className="text-sm text-gray-400 mt-1">+ Sub Services</p>
                  </div>
                  {pendingServices[0].profiles?.profile_picture_url ? (
                    <img 
                      src={pendingServices[0].profiles.profile_picture_url} 
                      className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md shrink-0 ml-4"
                      alt="Provider"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gray-200 border-2 border-white shadow-md shrink-0 ml-4"></div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <button 
                    onClick={() => setSelectedService(pendingServices[0])}
                    className="flex-1 bg-[#FDF0F3] text-[#89273B] py-3 rounded-xl font-semibold hover:bg-pink-100 transition-colors"
                  >
                    Inspect
                  </button>
                  <button 
                    onClick={() => handleReviewAction(pendingServices[0], 'active')}
                    className="flex-1 bg-[#89273B] text-white py-3 rounded-xl font-semibold hover:bg-[#722030] transition-colors shadow-lg shadow-red-900/20"
                  >
                    Approve
                  </button>
                </div>

                <div className="mt-auto pt-6 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-semibold text-gray-600">Others <span className="font-normal text-gray-400">| Total {pendingServices.length} Pending</span></p>
                    <button className="text-gray-400"><MoreVertical size={16}/></button>
                  </div>
                  
                  <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                    {pendingServices.map((service) => (
                      <div 
                        key={service.id}
                        onClick={() => setSelectedService(service)}
                        className="min-w-[200px] p-4 rounded-2xl border border-gray-100 bg-white cursor-pointer hover:border-[#89273B] transition-colors"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden shrink-0">
                            {service.profiles?.profile_picture_url && <img src={service.profiles.profile_picture_url} alt="" className="w-full h-full object-cover"/>}
                          </div>
                          <p className="text-xs font-semibold truncate">{service.profiles?.full_name}</p>
                        </div>
                        <p className="font-bold text-sm text-gray-800 truncate mb-1">{service.title}</p>
                        <p className="text-xs text-yellow-600 font-medium">Pending</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <CheckCircle size={48} className="text-green-500 mb-4" />
                <h3 className="text-xl font-bold text-gray-800">All Caught Up!</h3>
                <p className="text-gray-500">No pending services to review.</p>
              </div>
            )}
          </div>
        </div>

        {/* === BOTTOM SECTION: TABLE === */}
        <div className="bg-white rounded-2xl lg:rounded-3xl p-4 lg:p-8 shadow-sm border border-gray-100 w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 lg:mb-8 gap-3 lg:gap-4">
            <h3 className="text-lg lg:text-xl font-bold text-gray-800">Recent Services Request</h3>
            <div className="flex gap-2 lg:gap-4 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input type="text" placeholder="Search..." className="pl-10 pr-4 py-2 bg-gray-50 rounded-lg text-xs lg:text-sm w-full sm:w-auto border border-gray-100 focus:outline-none focus:border-[#89273B]" />
              </div>
              <button className="flex items-center justify-center gap-2 px-3 lg:px-4 py-2 bg-gray-50 rounded-lg text-xs lg:text-sm font-medium text-gray-600 hover:bg-gray-100 whitespace-nowrap">
                <Filter size={16} /> <span className="hidden sm:inline">Sort by</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="text-left text-gray-500 text-xs sm:text-sm border-b border-gray-100">
                    <th className="pb-3 lg:pb-4 font-medium pl-2 sm:pl-4">Service ID</th>
                    <th className="pb-3 lg:pb-4 font-medium hidden sm:table-cell">Date</th>
                    <th className="pb-3 lg:pb-4 font-medium">Provider</th>
                    <th className="pb-3 lg:pb-4 font-medium hidden lg:table-cell">Category</th>
                    <th className="pb-3 lg:pb-4 font-medium hidden md:table-cell">Service Name</th>
                    <th className="pb-3 lg:pb-4 font-medium">Status</th>
                    <th className="pb-3 lg:pb-4 font-medium hidden sm:table-cell">Ref</th>
                  </tr>
                </thead>
                <tbody className="text-xs sm:text-sm">
                  {services.map((item) => (
                    <tr key={item.id} onClick={() => setSelectedService(item)} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors group">
                      <td className="py-3 lg:py-4 pl-2 sm:pl-4 font-medium text-gray-900 group-hover:text-[#89273B] truncate">
                        LYF{item.id.substring(0, 4).toUpperCase()}
                      </td>
                      <td className="py-3 lg:py-4 text-gray-600 hidden sm:table-cell whitespace-nowrap">{format(new Date(item.created_at), 'd MMM yyyy')}</td>
                      <td className="py-3 lg:py-4 text-gray-600 truncate">{item.profiles?.full_name || 'Unknown'}</td>
                      <td className="py-3 lg:py-4 text-gray-600 hidden lg:table-cell">{item.service_categories?.name || 'General'}</td>
                      <td className="py-3 lg:py-4 text-gray-600 hidden md:table-cell truncate">{item.title}</td>
                      <td className="py-3 lg:py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(item.status)}`}>
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 lg:py-4 text-gray-500 text-xs hidden sm:table-cell">#{item.id.substring(0, 6)}</td>
                    </tr>
                  ))}
                  {services.length === 0 && (
                    <tr><td colSpan="7" className="text-center py-6 lg:py-8 text-gray-500 text-xs lg:text-sm">No services found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        {/* === SLIDE-OVER PANEL === */}
        <div className={`fixed inset-y-0 right-0 w-full sm:w-[400px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${selectedService ? 'translate-x-0' : 'translate-x-full'}`}>
          {selectedService && (
            <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <h3 className="text-lg sm:text-xl font-bold">Review Service</h3>
                <button onClick={() => setSelectedService(null)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20}/></button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="w-full h-40 sm:h-48 bg-gray-100 rounded-lg lg:rounded-xl mb-4 sm:mb-6 overflow-hidden">
                  {renderImage(selectedService.image_urls) ? (
                    <img src={renderImage(selectedService.image_urls)} alt="Service" className="w-full h-full object-cover"/>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-xs sm:text-sm">No Image</div>
                  )}
                </div>
                
                <div className="space-y-3 sm:space-y-4">
                  <div><label className="text-xs text-gray-400 font-medium uppercase">Service Title</label><p className="text-base sm:text-lg font-semibold mt-1">{selectedService.title}</p></div>
                  <div><label className="text-xs text-gray-400 font-medium uppercase">Price</label><p className="text-base sm:text-lg font-semibold text-[#89273B] mt-1">${selectedService.price} / hr</p></div>
                  <div><label className="text-xs text-gray-400 font-medium uppercase">Provider</label><p className="font-medium text-sm mt-1">{selectedService.profiles?.full_name}</p></div>
                  
                  <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-100">
                    <label className="text-xs text-gray-400 font-medium uppercase">Review Notes</label>
                    <textarea
                      className="w-full mt-2 p-3 border border-gray-200 rounded-lg lg:rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#89273B]"
                      rows="3"
                      placeholder="If rejecting, please specify the reason here..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                    ></textarea>
                  </div>
                </div>
              </div>

              <div className="pt-4 sm:pt-6 border-t border-gray-100 flex gap-3 flex-col sm:flex-row">
                <button onClick={() => handleReviewAction(selectedService, 'rejected')} className="flex-1 py-2 sm:py-3 border border-red-200 text-red-600 rounded-lg lg:rounded-xl font-medium text-xs sm:text-sm hover:bg-red-50 transition-colors">Reject</button>
                <button onClick={() => handleReviewAction(selectedService, 'active')} className="flex-1 py-2 sm:py-3 bg-[#89273B] text-white rounded-lg lg:rounded-xl font-medium text-xs sm:text-sm hover:bg-[#722030] transition-colors shadow-lg shadow-red-900/20">Approve</button>
              </div>
            </div>
          )}
        </div>
        
        {selectedService && (
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setSelectedService(null)}></div>
        )}

      </div>
    </Layout>
  );
};

export default Activities;