import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { useDropzone } from 'react-dropzone';
import { Calendar, Clock, MapPin, DollarSign, Image as ImageIcon, ChevronDown, Trash2, ArrowLeft } from 'lucide-react';
import api from '../lib/axios';
import { format } from 'date-fns';

const Events = () => {
  // --- STATE ---
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null); 
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Filters State
  const [filterStatus, setFilterStatus] = useState('All Events'); 
  const [sortPrice, setSortPrice] = useState('Price'); 
  const [sortDate, setSortDate] = useState('Date'); 

  // Form State
  const [formData, setFormData] = useState({
    title: '', about: '', eventDate: '', eventTime: '', price: '', location: '', image: null, imagePreview: null
  });

  // --- INITIAL LOAD ---
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      // FIX: Changed from '/admin/events' to '/events'
      const res = await api.get('/events');
      setEvents(res.data);
    } catch (error) {
      console.error("Failed to load events", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- ACTIONS ---

  const handleViewOnMap = () => {
    if (!selectedEvent?.location) return;
    const query = encodeURIComponent(selectedEvent.location);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure you want to delete this event? This cannot be undone.")) return;
    
    try {
      // FIX: Changed from '/admin/events/${id}' to '/events/${id}'
      await api.delete(`/events/${id}`);
      setSelectedEvent(null); 
      fetchEvents(); 
    } catch (e) {
      alert("Failed to delete event");
    }
  };

  const handleToggleStatus = async (event) => {
    const newStatus = !event.is_active; 
    try {
      // FIX: Changed from '/admin/events/.../status' to '/events/.../status'
      await api.put(`/events/${event.id}/status`, { is_active: newStatus });
      
      const updatedEvent = { ...event, is_active: newStatus };
      setSelectedEvent(updatedEvent);
      fetchEvents(); 
    } catch (e) {
      alert("Failed to update status");
    }
  };

  // --- FORM HANDLERS ---
  const onDrop = useCallback(acceptedFiles => {
    const file = acceptedFiles[0];
    setFormData(prev => ({ ...prev, image: file, imagePreview: URL.createObjectURL(file) }));
  }, []);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: {'image/*': []}, maxFiles: 1 });

  const handleSubmit = async () => {
    if (!formData.title || !formData.eventDate || !formData.price) {
      alert("Please fill in required fields");
      return;
    }
    
    setIsSubmitting(true);

    try {
      let finalImageUrl = "";

      if (formData.image) {
        const uploadData = new FormData();
        uploadData.append('file', formData.image);
        // Ensure you have updated storageRoutes.js to handle 'services' or change this to 'services'
        const uploadRes = await api.post('/storage/upload/services', uploadData, {
           headers: { 'Content-Type': 'multipart/form-data' }
        });
        finalImageUrl = uploadRes.data.url;
      }

      // FIX: Changed from '/admin/events' to '/events'
      await api.post('/events', {
        title: formData.title,
        description: formData.about,
        image_url: finalImageUrl,
        event_date: formData.eventDate,
        event_time: formData.eventTime,
        price: parseFloat(formData.price),
        location: formData.location
      });

      alert("Event Published!");
      setFormData({ title: '', about: '', eventDate: '', eventTime: '', price: '', location: '', image: null, imagePreview: null });
      fetchEvents();

    } catch (error) {
      console.error(error);
      alert("Failed to create event");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- FILTER & SORT LOGIC ---
  const getProcessedEvents = () => {
    let result = [...events];

    if (filterStatus === 'Active') result = result.filter(e => e.status === 'Active');
    else if (filterStatus === 'Inactive') result = result.filter(e => e.status === 'Inactive');

    if (sortPrice === 'High') result.sort((a, b) => b.price - a.price);
    else if (sortPrice === 'Low') result.sort((a, b) => a.price - b.price);

    if (sortDate === 'Newest') result.sort((a, b) => new Date(b.event_date) - new Date(a.event_date));
    else if (sortDate === 'Oldest') result.sort((a, b) => new Date(a.event_date) - new Date(b.event_date));

    return result;
  };

  const processedEvents = getProcessedEvents();

  return (
    <Layout>
      <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-100px)] gap-4 lg:gap-6">
        
        {/* --- LEFT COLUMN: CREATE FORM --- */}
        <div className={`w-full lg:w-[500px] flex flex-col overflow-y-auto pr-2 scrollbar-hide ${selectedEvent ? 'hidden lg:flex' : 'flex'}`}>
          <h2 className="text-xl lg:text-2xl font-bold text-gray-800 mb-4 lg:mb-6">Create Events</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Image</label>
            <div 
              {...getRootProps()} 
              className={`border-2 border-dashed rounded-2xl h-48 flex flex-col items-center justify-center cursor-pointer transition-colors
                ${isDragActive ? 'border-[#89273B] bg-pink-50' : 'border-gray-200 bg-[#FAF9F9]'}
              `}
            >
              <input {...getInputProps()} />
              {formData.imagePreview ? (
                <img src={formData.imagePreview} alt="Preview" className="h-full w-full object-cover rounded-2xl" />
              ) : (
                <div className="text-center">
                  <div className="bg-[#89273B]/10 p-3 rounded-full inline-block mb-3">
                    <ImageIcon className="text-[#89273B]" size={24} />
                  </div>
                  <p className="text-sm font-semibold text-gray-700">Click to browse</p>
                  <p className="text-xs text-gray-400 mt-1">Or drag image here (4mb Max)</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input type="text" className="w-full bg-[#F5F5F5] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#89273B]" placeholder="28th Tbilisi Jazz Festival" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">About</label>
              <textarea className="w-full bg-[#F5F5F5] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#89273B] min-h-[100px]" placeholder="Get ready for an electrifying experience..." value={formData.about} onChange={e => setFormData({...formData, about: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Time</label>
                <input type="time" className="w-full bg-[#F5F5F5] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#89273B]" value={formData.eventTime} onChange={e => setFormData({...formData, eventTime: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Date</label>
                <input type="date" className="w-full bg-[#F5F5F5] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#89273B]" value={formData.eventDate} onChange={e => setFormData({...formData, eventDate: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Starting Price</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input type="number" className="w-full bg-[#F5F5F5] rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#89273B]" placeholder="12,500" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input type="text" className="w-full bg-[#F5F5F5] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#89273B]" placeholder="Emir Palace, Kano Nigeria" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
              </div>
            </div>
          </div>

          <button onClick={handleSubmit} disabled={isSubmitting} className="mt-8 w-full bg-[#89273B] text-white rounded-xl py-3 font-semibold hover:bg-[#722030] transition-colors shadow-lg shadow-[#89273B]/20">
            {isSubmitting ? 'Publishing...' : 'Publish'}
          </button>
        </div>

        {/* --- RIGHT COLUMN: LIST or DETAILS --- */}
        <div className="flex-1 bg-white rounded-2xl lg:rounded-3xl p-4 lg:p-6 shadow-sm border border-gray-100 flex flex-col h-auto lg:h-full overflow-hidden">
          
          {selectedEvent ? (
            <div className="flex flex-col h-full animate-in slide-in-from-right duration-300">
              <div className="mb-4">
                <button onClick={() => setSelectedEvent(null)} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-xs lg:text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors">
                  <ArrowLeft size={16} /> Back
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2">
                <div className="w-full h-40 lg:h-56 rounded-xl lg:rounded-2xl overflow-hidden mb-4 lg:mb-6 bg-gray-100">
                  <img src={selectedEvent.image_url || 'https://via.placeholder.com/600x300'} alt={selectedEvent.title} className="w-full h-full object-cover" onError={(e) => {e.target.src = 'https://via.placeholder.com/600x300'}} />
                </div>

                <div className="mb-4 lg:mb-6">
                  <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">{selectedEvent.title}</h2>
                  <p className="text-gray-500 text-xs lg:text-sm leading-relaxed">{selectedEvent.description || "No description provided."}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 lg:gap-4 mb-4 lg:mb-6">
                   <div className="bg-[#FAFAFA] p-3 lg:p-4 rounded-xl lg:rounded-2xl">
                     <Calendar className="text-gray-400 mb-2" size={18} />
                     <p className="text-xs text-gray-500 mb-1">Event Date</p>
                     <p className="font-semibold text-gray-800 text-xs lg:text-sm">{format(new Date(selectedEvent.event_date), 'MMM d, yyyy')}</p>
                   </div>
                   <div className="bg-[#FAFAFA] p-3 lg:p-4 rounded-xl lg:rounded-2xl">
                     <Clock className="text-gray-400 mb-2" size={18} />
                     <p className="text-xs text-gray-500 mb-1">Event Time</p>
                     <p className="font-semibold text-gray-800 text-xs lg:text-sm">{selectedEvent.event_time}</p>
                   </div>
                </div>

                <div className="bg-[#FAFAFA] p-3 lg:p-4 rounded-xl lg:rounded-2xl mb-6 lg:mb-8">
                   <MapPin className="text-gray-400 mb-2" size={18} />
                   <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-2">
                      <div>
                        <p className="font-semibold text-gray-800 mb-1 text-sm">Location</p>
                        <p className="text-xs lg:text-sm text-gray-500">{selectedEvent.location}</p>
                      </div>
                      <button onClick={handleViewOnMap} className="text-xs bg-white border border-gray-200 px-3 py-1 rounded-full text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors whitespace-nowrap">View on Map</button>
                   </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 mt-auto">
                 <div className="flex items-center justify-between mb-4">
                    <span className="text-xs lg:text-sm text-gray-500">Starting from</span>
                 </div>
                 <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <h3 className="text-xl lg:text-2xl font-bold text-gray-900">${selectedEvent.price.toLocaleString()}</h3>
                    
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button onClick={() => handleDelete(selectedEvent.id)} className="flex-1 sm:flex-none w-10 h-10 flex items-center justify-center bg-[#FDF0F3] rounded-lg lg:rounded-xl text-[#89273B] hover:bg-red-100 transition-colors" title="Delete Event"><Trash2 size={18} /></button>
                      <button onClick={() => handleToggleStatus(selectedEvent)} className={`flex-1 px-6 py-2 lg:py-3 rounded-lg lg:rounded-xl font-medium text-xs lg:text-base text-white transition-colors shadow-lg ${selectedEvent.is_active ? 'bg-[#89273B] hover:bg-[#722030] shadow-red-900/20' : 'bg-green-600 hover:bg-green-700 shadow-green-900/20'}`}>{selectedEvent.is_active ? 'Deactivate' : 'Activate'}</button>
                    </div>
                 </div>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-800">Listed Events</h2>
                <div className="flex gap-2 mt-3">
                  <FilterDropdown label={filterStatus} options={['All Events', 'Active', 'Inactive']} onSelect={setFilterStatus} />
                  <FilterDropdown label={sortPrice === 'Price' ? 'Price' : `Price: ${sortPrice}`} options={['High', 'Low']} onSelect={setSortPrice} />
                  <FilterDropdown label={sortDate === 'Date' ? 'Date' : `Date: ${sortDate}`} options={['Newest', 'Oldest']} onSelect={setSortDate} />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {isLoading ? (
                  <p className="text-center text-gray-500 mt-10">Loading events...</p>
                ) : processedEvents.length === 0 ? (
                  <p className="text-center text-gray-500 mt-10">No events found.</p>
                ) : (
                  processedEvents.map((event) => (
                    <div key={event.id} onClick={() => setSelectedEvent(event)} className="bg-[#FAFAFA] rounded-2xl p-4 flex gap-4 transition-transform hover:scale-[1.01] cursor-pointer">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800 text-lg mb-2">{event.title}</h3>
                        <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
                          <div className="flex items-center gap-2"><Calendar size={14} /><span>{format(new Date(event.event_date), 'MMM d, yyyy')}</span></div>
                          <div className="flex items-center gap-2"><DollarSign size={14} /><span>{event.price.toLocaleString()}</span></div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#89273B] font-bold text-lg">${event.price.toLocaleString()}</span>
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <div className={`w-2 h-2 rounded-full ${event.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className={event.status === 'Active' ? 'text-green-700' : 'text-gray-500'}>{event.status}</span>
                          </div>
                        </div>
                      </div>
                      <img src={event.image_url || 'https://via.placeholder.com/100'} alt={event.title} className="w-24 h-24 rounded-xl object-cover bg-gray-200" onError={(e) => {e.target.src = 'https://via.placeholder.com/100'}} />
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

const FilterDropdown = ({ label, options, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 px-4 py-2 bg-[#F5F5F5] rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors">
        {label} <ChevronDown size={14} />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 top-full mt-2 w-32 bg-white rounded-xl shadow-xl border border-gray-100 z-20 py-2">
            {options.map(opt => <button key={opt} onClick={() => { onSelect(opt); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#89273B]">{opt}</button>)}
          </div>
        </>
      )}
    </div>
  );
};

export default Events;