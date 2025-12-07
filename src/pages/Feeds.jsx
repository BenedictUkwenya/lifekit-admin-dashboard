import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { useDropzone } from 'react-dropzone';
import { Image as ImageIcon, Trash2, Send } from 'lucide-react';
import api from '../lib/axios';
import { format } from 'date-fns';

const Feeds = () => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    content: '',
    image: null,
    imagePreview: null
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await api.get('/feeds/posts');
      setPosts(res.data);
    } catch (error) {
      console.error("Failed to load posts", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- HANDLERS ---
  
  const onDrop = useCallback(acceptedFiles => {
    const file = acceptedFiles[0];
    setFormData(prev => ({
      ...prev,
      image: file,
      imagePreview: URL.createObjectURL(file)
    }));
  }, []);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, accept: {'image/*': []}, maxFiles: 1 
  });

  const handleSubmit = async () => {
    if (!formData.content) {
      alert("Please write some content.");
      return;
    }
    
    setIsSubmitting(true);

    try {
      let finalImageUrl = "";

      // Upload Image if exists
      if (formData.image) {
        const uploadData = new FormData();
        uploadData.append('file', formData.image);
        const uploadRes = await api.post('/storage/upload/services', uploadData, {
           headers: { 'Content-Type': 'multipart/form-data' }
        });
        finalImageUrl = uploadRes.data.url;
      }

      // Create Post
      await api.post('/feeds/posts', {
        content: formData.content,
        image_url: finalImageUrl,
      });

      alert("Post Created!");
      setFormData({ content: '', image: null, imagePreview: null });
      fetchPosts();

    } catch (error) {
      alert("Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Delete this post?")) return;
    try {
      await api.delete(`/feeds/posts/${id}`);
      fetchPosts();
    } catch (e) { alert("Failed to delete"); }
  };

  return (
    <Layout>
      <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-100px)] gap-4 lg:gap-6">
        
        {/* --- LEFT: CREATE POST --- */}
        <div className="w-full lg:w-[450px] flex flex-col">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Create Feed</h2>

          <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-3xl shadow-sm border border-gray-100 h-full flex flex-col">
            
            {/* Image Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Upload Image (Optional)</label>
              <div 
                {...getRootProps()} 
                className={`border-2 border-dashed rounded-2xl h-48 flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden
                  ${isDragActive ? 'border-[#89273B] bg-pink-50' : 'border-gray-200 bg-[#FAF9F9]'}
                `}
              >
                <input {...getInputProps()} />
                {formData.imagePreview ? (
                  <img src={formData.imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <div className="bg-[#89273B]/10 p-3 rounded-full inline-block mb-3">
                      <ImageIcon className="text-[#89273B]" size={24} />
                    </div>
                    <p className="text-sm font-semibold text-gray-700">Click to browse</p>
                  </div>
                )}
              </div>
              {formData.imagePreview && (
                <button onClick={(e) => { e.stopPropagation(); setFormData({...formData, image: null, imagePreview: null})}} className="text-xs text-red-500 mt-2 hover:underline">Remove Image</button>
              )}
            </div>

            {/* Content Input */}
            <div className="flex-1 mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Post Content</label>
              <textarea 
                className="w-full h-full bg-[#F9F9F9] rounded-xl p-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#89273B] resize-none"
                placeholder="What's happening? Share updates, news, or tips..."
                value={formData.content}
                onChange={e => setFormData({...formData, content: e.target.value})}
              />
            </div>

            <button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-[#89273B] text-white rounded-xl py-3 font-semibold hover:bg-[#722030] transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Posting...' : <><Send size={18} /> Post Feed</>}
            </button>
          </div>
        </div>

        {/* --- RIGHT: FEED LIST --- */}
        <div className="flex-1 bg-white rounded-3xl p-4 sm:p-6 lg:p-8 shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Live Feeds</h2>
          
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {isLoading ? (
              <p className="text-center text-gray-500 mt-10">Loading feeds...</p>
            ) : posts.length === 0 ? (
              <div className="text-center mt-20 text-gray-400">
                <p>No posts yet.</p>
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="border border-gray-100 rounded-2xl p-4 flex gap-4 hover:shadow-sm transition-all">
                  {/* Image Thumbnail */}
                  <div className="w-24 h-24 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                    {post.image_url ? (
                      <img src={post.image_url} className="w-full h-full object-cover" alt="Post" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <ImageIcon size={20} />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm text-gray-800">Admin</span>
                        <span className="text-xs text-gray-400">• {format(new Date(post.created_at), 'MMM d, h:mm a')}</span>
                      </div>
                      <button onClick={() => handleDelete(post.id)} className="text-gray-300 hover:text-red-500">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    
                    <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                      {post.content}
                    </p>

                    <div className="mt-auto pt-2 flex gap-4 text-xs text-gray-400">
                      <span>❤️ {post.likes_count} Likes</span>
                      <span>💬 {post.comments_count} Comments</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </Layout>
  );
};

export default Feeds;