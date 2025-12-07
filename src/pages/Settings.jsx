import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { useDropzone } from 'react-dropzone';
import { User, Mail, Share2, FileText, UserPlus, Layers, Trash2, Plus, ArrowLeft, FolderOpen, ChevronRight, UploadCloud } from 'lucide-react';
import api from '../lib/axios';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Data States
  const [admins, setAdmins] = useState([]);
  const [categories, setCategories] = useState([]); 
  
  // Logic State for Drill-Down
  const [selectedParent, setSelectedParent] = useState(null); 

  // Forms
  // Added 'imageFile' to track the raw file selected by user
  const [profileForm, setProfileForm] = useState({ 
    full_name: '', 
    job_title: '', 
    bio: '', 
    avatar_url: '', 
    imageFile: null 
  });
  
  const [newAdminForm, setNewAdminForm] = useState({ email: '', password: '', full_name: '' });
  const [newCatForm, setNewCatForm] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // 1. Get User from LocalStorage
      const userStr = localStorage.getItem('admin_user');
      if(userStr) {
         const u = JSON.parse(userStr);
         // Try to pull data from user_metadata first, fallback to DB fetch
         setProfileForm(prev => ({
            ...prev,
            full_name: u.user_metadata?.full_name || '',
            job_title: u.user_metadata?.job_title || '',
            avatar_url: u.user_metadata?.avatar_url || '' // Assuming we store this here
         }));
         
         // Fetch fresh profile from DB to be sure
         const profileRes = await api.get('/users/profile');
         const p = profileRes.data.profile;
         if(p) {
            setProfileForm(prev => ({
                ...prev,
                full_name: p.full_name || '',
                job_title: p.job_title || '', // Ensure your DB has this column or metadata
                bio: p.bio || '',
                avatar_url: p.profile_picture_url || ''
            }));
         }
      }

      // 2. Fetch Backend Data
      const [adminsRes, catRes] = await Promise.all([
        api.get('/admin/users/admins'),
        api.get('/admin/categories')
      ]);

      setAdmins(adminsRes.data);
      setCategories(catRes.data);

    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- PROFILE ACTIONS (FIXED) ---
  
  // 1. Handle File Selection
  const onDrop = useCallback(acceptedFiles => {
    const file = acceptedFiles[0];
    if (file) {
        setProfileForm(prev => ({
            ...prev,
            imageFile: file,
            // Create a temporary preview URL
            avatar_url: URL.createObjectURL(file) 
        }));
    }
  }, []);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, maxFiles: 1, accept: {'image/*': []} });

  // 2. Handle Save Changes
  const handleUpdateProfile = async () => {
    setIsSaving(true);
    try {
        let finalAvatarUrl = profileForm.avatar_url;

        // Step A: Upload Image if a new file was selected
        if (profileForm.imageFile) {
            const formData = new FormData();
            formData.append('file', profileForm.imageFile);
            
            // Assuming you have a generic upload route or specific avatar route
            // If /storage/upload/avatars doesn't exist, change to /storage/upload/services or check backend
            const uploadRes = await api.post('/storage/upload/avatars', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            finalAvatarUrl = uploadRes.data.url;
        }

        // Step B: Update Profile Data
        const payload = {
            full_name: profileForm.full_name,
            job_title: profileForm.job_title,
            bio: profileForm.bio,
            profile_picture_url: finalAvatarUrl
        };

        // Call the user profile update endpoint
        await api.put('/users/profile', payload);

        // Step C: Update LocalStorage (So Header/Sidebar updates immediately)
        const userStr = localStorage.getItem('admin_user');
        if(userStr) {
            const u = JSON.parse(userStr);
            u.user_metadata = { 
                ...u.user_metadata, 
                full_name: payload.full_name,
                job_title: payload.job_title 
                // Note: avatar usually comes from DB relation, but we can cache it if needed
            };
            localStorage.setItem('admin_user', JSON.stringify(u));
        }

        alert("Profile updated successfully!");
        
        // Clear the file from state to prevent re-uploading
        setProfileForm(prev => ({ ...prev, imageFile: null, avatar_url: finalAvatarUrl }));

    } catch (error) {
        console.error("Update failed", error);
        alert("Failed to update profile. " + (error.response?.data?.error || ""));
    } finally {
        setIsSaving(false);
    }
  };

  // --- ADMIN ACTIONS ---
  const handleAddAdmin = async () => {
    if (!newAdminForm.email || !newAdminForm.password) return alert("Please fill fields");
    try {
      await api.post('/admin/users/invite-admin', newAdminForm);
      alert('Admin added successfully');
      setNewAdminForm({ email: '', password: '', full_name: '' });
      const res = await api.get('/admin/users/admins');
      setAdmins(res.data);
    } catch (e) {
      alert(`Failed: ${e.response?.data?.error || e.message}`);
    }
  };

  const handleRemoveAdmin = async (id) => {
    if(!window.confirm("Remove this admin?")) return;
    try {
      await api.delete(`/admin/users/admins/${id}`);
      setAdmins(admins.filter(a => a.id !== id));
    } catch (e) { alert("Failed to remove admin"); }
  };

  // --- CATEGORY ACTIONS ---
  const handleAddCategory = async () => {
    if (!newCatForm.name) {
      alert("Please enter a category name");
      return;
    }
    try {
      const payload = {
        name: newCatForm.name,
        description: newCatForm.description,
        parent_id: selectedParent ? selectedParent.id : null 
      };
      await api.post('/admin/categories', payload);
      setNewCatForm({ name: '', description: '' });
      const res = await api.get('/admin/categories');
      setCategories(res.data);
      alert(selectedParent ? "Sub-Category added!" : "Main Category added!");
    } catch (e) { 
      alert(`Failed to add category: ${e.response?.data?.error || e.message}`); 
    }
  };

  const handleDeleteCategory = async (id, e) => {
    e.stopPropagation(); 
    if(!window.confirm("Delete this category? Sub-categories inside will also be deleted.")) return;
    try {
      await api.delete(`/admin/categories/${id}`);
      setCategories(categories.filter(c => c.id !== id));
    } catch (e) { alert("Failed to delete"); }
  };

  const displayedCategories = selectedParent 
    ? categories.filter(c => c.parent_category_id === selectedParent.id) 
    : categories.filter(c => !c.parent_category_id); 

  // --- UI COMPONENTS ---
  const MenuButton = ({ id, icon: Icon, label }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors mb-2 text-sm font-medium ${
        activeTab === id ? 'bg-[#EAEAEA] text-gray-900' : 'text-gray-500 hover:bg-gray-50'
      }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Settings</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8 items-start">
        
        {/* === LEFT SIDEBAR MENU === */}
        <div className="w-full lg:w-1/4 order-2 lg:order-1">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-100 sticky top-24">
            <p className="text-xs font-semibold text-gray-400 mb-4 uppercase tracking-wider">Select Menu</p>
            <MenuButton id="profile" icon={User} label="Profile Settings" />
            <MenuButton id="admins" icon={UserPlus} label="Manage Admins" />
            <MenuButton id="categories" icon={Layers} label="Service Categories" />
            <div className="h-px bg-gray-100 my-2"></div>
            <MenuButton id="contact" icon={Mail} label="Contact Information" />
            <MenuButton id="social" icon={Share2} label="Social Links" />
            <MenuButton id="export" icon={FileText} label="Export Data" />
          </div>
        </div>

        {/* === RIGHT CONTENT AREA === */}
        <div className="w-full lg:w-3/4 order-1 lg:order-2">
          
          {/* TAB 1: PROFILE SETTINGS */}
          {activeTab === 'profile' && (
            <div className="animate-in fade-in duration-300">
              
              {/* Avatar Upload */}
              <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-sm border border-gray-100 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 w-full sm:w-auto">
                  <div 
                    {...getRootProps()} 
                    className={`w-24 h-24 rounded-full bg-gray-100 overflow-hidden cursor-pointer hover:opacity-80 relative border-2 flex-shrink-0 ${isDragActive ? 'border-[#89273B]' : 'border-transparent'}`}
                  >
                    <input {...getInputProps()} />
                    {profileForm.avatar_url ? (
                        <img src={profileForm.avatar_url} className="w-full h-full object-cover" alt="Profile"/>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400"><User size={32}/></div>
                    )}
                    
                    {/* Hover Overlay Icon */}
                    <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                        <UploadCloud className="text-white" size={24} />
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900">Upload Image</h3>
                    <p className="text-xs sm:text-sm text-gray-500">Min 400x400 px (JPG, PNG)</p>
                  </div>
                </div>
                
                <div className="flex gap-3 w-full sm:w-auto">
                  <div {...getRootProps()} className="flex-1 sm:flex-none">
                     <input {...getInputProps()} />
                     <button className="w-full px-6 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap">
                        Click to Upload
                     </button>
                  </div>
                </div>
              </div>

              {/* Form */}
              <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-sm border border-gray-100 mb-6">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name*</label>
                    <input 
                        type="text" 
                        value={profileForm.full_name} 
                        onChange={(e) => setProfileForm({...profileForm, full_name: e.target.value})} 
                        className="w-full bg-[#F9F9F9] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#89273B] border border-transparent focus:bg-white transition-colors" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title / Role</label>
                    <input 
                        type="text" 
                        value={profileForm.job_title} 
                        placeholder="e.g. Super Admin" 
                        onChange={(e) => setProfileForm({...profileForm, job_title: e.target.value})} 
                        className="w-full bg-[#F9F9F9] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#89273B] border border-transparent focus:bg-white transition-colors" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Biography</label>
                    <textarea 
                        rows="4" 
                        placeholder="Tell us a little about yourself..." 
                        value={profileForm.bio}
                        onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})}
                        className="w-full bg-[#F9F9F9] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#89273B] border border-transparent focus:bg-white transition-colors"
                    ></textarea>
                  </div>
                  <div className="flex justify-end">
                     <button 
                        onClick={handleUpdateProfile} 
                        disabled={isSaving}
                        className="px-8 py-3 bg-[#89273B] text-white rounded-xl font-medium shadow-lg shadow-red-900/20 hover:bg-[#722030] disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                     >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                     </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MANAGE ADMINS */}
          {activeTab === 'admins' && (
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-sm border border-gray-100 animate-in fade-in duration-300">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Add New Admin</h3>
              <p className="text-gray-500 text-xs sm:text-sm mb-6 sm:mb-8">Create a new administrative account.</p>
              
              <div className="space-y-4 max-w-md">
                <input type="text" placeholder="Full Name" className="w-full bg-[#F9F9F9] rounded-xl px-4 py-3 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-[#89273B]" value={newAdminForm.full_name} onChange={e => setNewAdminForm({...newAdminForm, full_name: e.target.value})} />
                <input type="email" placeholder="Email Address" className="w-full bg-[#F9F9F9] rounded-xl px-4 py-3 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-[#89273B]" value={newAdminForm.email} onChange={e => setNewAdminForm({...newAdminForm, email: e.target.value})} />
                <input type="password" placeholder="Password" className="w-full bg-[#F9F9F9] rounded-xl px-4 py-3 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-[#89273B]" value={newAdminForm.password} onChange={e => setNewAdminForm({...newAdminForm, password: e.target.value})} />
                <button onClick={handleAddAdmin} className="w-full py-3 bg-[#89273B] text-white rounded-xl font-medium text-sm sm:text-base shadow-lg shadow-red-900/20 hover:bg-[#722030] mt-4">Create Admin Account</button>
              </div>

              <div className="mt-8 sm:mt-12">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Existing Admins</h3>
                <div className="space-y-3 sm:space-y-4">
                  {admins.map(admin => (
                    <div key={admin.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-teal-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {admin.full_name ? admin.full_name[0] : 'A'}
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-gray-700 truncate">{admin.email || admin.full_name}</span>
                      </div>
                      <button onClick={() => handleRemoveAdmin(admin.id)} className="text-red-500 text-xs font-medium hover:underline px-2 w-fit sm:w-auto">Remove</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SERVICE CATEGORIES (Folder System) */}
          {activeTab === 'categories' && (
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-sm border border-gray-100 animate-in fade-in duration-300 min-h-[500px]">
              
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div>
                  {selectedParent ? (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <button 
                            onClick={() => setSelectedParent(null)} 
                            className="flex items-center gap-1 text-xs sm:text-sm font-medium text-gray-500 hover:text-[#89273B] transition-colors w-fit"
                        >
                            <ArrowLeft size={16}/> Back
                        </button>
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                            <span className="text-gray-300">/</span> {selectedParent.name}
                        </h3>
                    </div>
                  ) : (
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">Service Categories</h3>
                  )}
                  <p className="text-gray-500 text-xs sm:text-sm mt-1">
                    {selectedParent 
                        ? `Manage sub-categories inside "${selectedParent.name}".` 
                        : "Manage root categories. Click a category to view/add sub-items."}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-end mb-8 sm:mb-10 bg-[#FAFAFA] p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-100">
                <div className="flex-1 w-full sm:min-w-[200px]">
                  <label className="text-xs font-medium text-gray-500 mb-1 block">
                    {selectedParent ? 'Sub-Category Name' : 'Main Category Name'}
                  </label>
                  <input 
                    type="text" 
                    placeholder={selectedParent ? "e.g. Box Braids" : "e.g. Hair & Beauty"}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-[#89273B]"
                    value={newCatForm.name}
                    onChange={e => setNewCatForm({...newCatForm, name: e.target.value})}
                  />
                </div>
                
                <div className="flex-1 sm:flex-[2] w-full sm:min-w-[200px]">
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Description</label>
                  <input 
                    type="text" 
                    placeholder="Short description..."
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-[#89273B]"
                    value={newCatForm.description}
                    onChange={e => setNewCatForm({...newCatForm, description: e.target.value})}
                  />
                </div>
                <button 
                  onClick={handleAddCategory}
                  className="h-[38px] px-4 sm:px-6 bg-[#89273B] text-white rounded-xl text-xs sm:text-sm font-medium hover:bg-[#722030] flex items-center gap-2 w-full sm:w-auto justify-center"
                >
                  <Plus size={16} /> {selectedParent ? 'Add Sub' : 'Add Main'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {displayedCategories.length === 0 && (
                    <div className="col-span-1 sm:col-span-2 text-center py-12 bg-gray-50 rounded-2xl text-gray-400 border border-dashed border-gray-200">
                        <FolderOpen size={32} className="mx-auto mb-2 opacity-20"/>
                        {selectedParent ? "No sub-categories yet." : "No categories found."}
                    </div>
                )}

                {displayedCategories.map(cat => (
                  <div 
                    key={cat.id} 
                    onClick={() => !selectedParent && setSelectedParent(cat)}
                    className={`border border-gray-100 rounded-lg sm:rounded-2xl p-3 sm:p-5 transition-all bg-white relative group
                        ${!selectedParent ? 'cursor-pointer hover:border-[#89273B] hover:shadow-md' : ''}
                    `}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-start gap-2 sm:gap-3 mb-2 flex-1 min-w-0">
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${selectedParent ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-[#89273B]'}`}>
                          {selectedParent ? <Layers size={18} /> : <FolderOpen size={18} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-800 text-sm truncate">{cat.name}</h4>
                          {!selectedParent && (
                             <div className="flex items-center gap-1 text-xs text-gray-400 group-hover:text-[#89273B] transition-colors">
                                <span>Open Folder</span> <ChevronRight size={12} />
                             </div>
                          )}
                        </div>
                      </div>
                      
                      <button 
                        onClick={(e) => handleDeleteCategory(cat.id, e)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors z-10 flex-shrink-0"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 pl-8 sm:pl-[52px] truncate">
                      {cat.description || "No description."}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
};

export default Settings;