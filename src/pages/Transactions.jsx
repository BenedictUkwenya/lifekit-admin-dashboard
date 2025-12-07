import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../lib/axios';
import { format, isFuture, isPast } from 'date-fns';
import { Search, MapPin, Clock, CheckCircle, Hourglass, Calendar } from 'lucide-react';

const Transactions = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'Completed', 'Upcoming'
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  // --- 1. FILTER LOGIC ---
  useEffect(() => {
    let result = bookings;

    // A. Filter by Tab
    if (statusFilter === 'Completed') {
      result = result.filter(b => b.status === 'completed' || b.status === 'active'); 
    } else if (statusFilter === 'Upcoming') {
      // Logic: Status is 'confirmed' OR 'pending' AND date is in future
      result = result.filter(b => 
        (b.status === 'confirmed' || b.status === 'pending') && 
        isFuture(new Date(b.scheduled_time || b.created_at))
      );
    }

    // B. Filter by Search (Service Provider Name)
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(b => 
        b.services?.profiles?.full_name?.toLowerCase().includes(lowerTerm) ||
        b.services?.title?.toLowerCase().includes(lowerTerm)
      );
    }

    setFilteredBookings(result);
  }, [bookings, statusFilter, searchTerm]);

  const fetchBookings = async () => {
    try {
      const res = await api.get('/admin/bookings/all');
      setBookings(res.data);
      setFilteredBookings(res.data);
    } catch (error) {
      console.error("Failed to load bookings", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-4 lg:mb-6">Track Bookings</h1>

        {/* --- HEADER: FILTERS & SEARCH --- */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 lg:gap-4">
          
          {/* Tabs */}
          <div className="flex gap-2 lg:gap-4 overflow-x-auto w-full sm:w-auto">
            {['All', 'Completed', 'Upcoming'].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`flex items-center gap-1 lg:gap-2 px-4 lg:px-6 py-2 lg:py-2.5 rounded-full font-medium text-xs lg:text-sm transition-all whitespace-nowrap ${
                  statusFilter === tab
                    ? 'bg-[#89273B] text-white shadow-lg shadow-red-900/20'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tab === 'All' && <div className="w-2 h-2 rounded-full bg-white/50" />}
                {tab === 'Completed' && <CheckCircle size={14} />}
                {tab === 'Upcoming' && <Clock size={14} />}
                {tab}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:flex-1 lg:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 size-4 lg:size-5" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 lg:pl-12 pr-4 py-2 lg:py-3 bg-white rounded-full text-xs lg:text-sm border border-gray-100 shadow-sm focus:outline-none focus:border-[#89273B] focus:ring-1 focus:ring-[#89273B]" 
            />
          </div>
        </div>
      </div>

      {/* --- CONTENT: BOOKING CARDS --- */}
      {loading ? (
        <div className="flex justify-center p-10 text-gray-500">Loading bookings...</div>
      ) : filteredBookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Calendar size={64} className="mb-4 opacity-20" />
          <p>No bookings found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {filteredBookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      )}
    </Layout>
  );
};

// --- INDIVIDUAL CARD COMPONENT ---
const BookingCard = ({ booking }) => {
  const [expanded, setExpanded] = useState(true);

  // 1. Extract Data
  const provider = booking.services?.profiles;
  const service = booking.services;
  const date = new Date(booking.scheduled_time || booking.created_at);
  const isDatePast = isPast(date); // Check if date is in the past
  
  // 2. Logic: Status Badge
  // Default State
  let statusBadge = { label: 'Upcoming', bg: 'bg-blue-50', text: 'text-blue-600' };

  if (booking.status === 'completed') {
    statusBadge = { label: 'Completed', bg: 'bg-green-50', text: 'text-green-600' };
  } 
  else if (booking.status === 'cancelled') {
    statusBadge = { label: 'Cancelled', bg: 'bg-red-50', text: 'text-red-600' };
  } 
  // LOGIC FIX HERE:
  else if (isDatePast) {
    if (booking.status === 'confirmed') {
      // Confirmed + Past = Ongoing (Work in progress)
      statusBadge = { label: 'Ongoing', bg: 'bg-yellow-50', text: 'text-yellow-600' };
    } else if (booking.status === 'pending') {
      // Pending + Past = Expired (Provider didn't accept in time)
      statusBadge = { label: 'Expired', bg: 'bg-gray-100', text: 'text-gray-500' };
    }
  }

  // 3. Logic: Calculate Qty (Hours) based on Price
  // If Total is 200 and Hourly Rate is 50, then Qty is 4.
  const hourlyRate = service?.price || 50; // Fallback to avoid div by zero
  const calculatedHours = Math.max(1, Math.round(booking.total_price / hourlyRate));

  return (
    <div className="bg-white rounded-xl lg:rounded-[2rem] p-4 lg:p-6 shadow-sm border border-gray-100 flex flex-col transition-transform hover:scale-[1.01]">
      
      {/* Header: Provider Info & Status */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3 lg:mb-4">
        <div className="flex gap-2 lg:gap-3 min-w-0">
          {/* Avatar */}
          <div className="w-10 lg:w-12 h-10 lg:h-12 rounded-lg lg:rounded-2xl bg-[#2C5F68] overflow-hidden shrink-0"> 
             {provider?.profile_picture_url && (
               <img src={provider.profile_picture_url} className="w-full h-full object-cover" alt="Provider"/>
             )}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900 text-sm lg:text-base truncate">{provider?.full_name || 'Unknown'}</h3>
            <p className="text-xs text-gray-500">{booking.status === 'pending' ? 'Pending' : 'Finished'}</p>
          </div>
        </div>
        
        {/* Status Badge */}
        <span className={`px-2 py-0.5 lg:px-3 lg:py-1 rounded-full text-xs font-semibold whitespace-nowrap ${statusBadge.bg} ${statusBadge.text} shrink-0`}>
          {statusBadge.label}
        </span>
      </div>

      {/* Date Row */}
      <div className="flex justify-between items-center text-xs lg:text-sm text-gray-600 mb-3 lg:mb-6 pb-3 lg:pb-4 border-b border-gray-50">
        <span className="truncate">{format(date, 'EEE. MMM d')}</span>
        <span className="whitespace-nowrap ml-2">{calculatedHours}h</span>
      </div>

      {/* Services Table (Collapsible) */}
      {expanded && (
        <div className="mb-4 lg:mb-6 animate-in fade-in duration-300">
          <table className="w-full text-xs lg:text-sm">
            <thead>
              <tr className="text-gray-400 font-medium text-xs">
                <td className="pb-2">Services</td>
                <td className="pb-2 text-center">Qty</td>
                <td className="pb-2 text-right">Time</td>
              </tr>
            </thead>
            <tbody className="text-gray-700 font-medium">
              <tr>
                <td className="py-2 truncate">{service?.title || 'General Service'}</td>
                <td className="py-2 text-center">{calculatedHours}</td>
                <td className="py-2 text-right whitespace-nowrap">{format(date, 'h:mm a')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Total & Footer */}
      <div className="mt-auto">
        <div className="flex justify-between items-center mb-4 lg:mb-6 text-sm lg:text-base">
          <span className="text-gray-500 font-medium">Total</span>
          <span className="text-lg lg:text-xl font-bold text-gray-900">${booking.total_price?.toLocaleString()}</span>
        </div>

        <div className="flex gap-2 lg:gap-3">
          <button 
            onClick={() => setExpanded(!expanded)}
            className="flex-1 py-2 lg:py-3 rounded-lg lg:rounded-xl bg-[#F9EAEB] text-[#89273B] font-semibold text-xs lg:text-sm hover:bg-pink-100 transition-colors"
          >
            {expanded ? 'Less' : 'Details'}
          </button>
          <button className="flex-1 py-2 lg:py-3 rounded-lg lg:rounded-xl bg-[#89273B] text-white font-semibold text-xs lg:text-sm hover:bg-[#722030] transition-colors shadow-lg shadow-red-900/20">
            Track
          </button>
        </div>
      </div>

    </div>
  );
};

export default Transactions;