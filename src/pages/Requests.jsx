import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../lib/axios';
import { CheckCircle, X, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';

const Requests = () => {
  const [requests, setRequests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [approveName, setApproveName] = useState('');
  const [approveParent, setApproveParent] = useState('');

  const fetchData = async () => {
    try {
      const [requestsRes, categoriesRes] = await Promise.all([
        api.get('/admin/category-requests'),
        api.get('/admin/categories')
      ]);
      setRequests(requestsRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      console.error('Error fetching category requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openApproveModal = (request) => {
    setSelectedRequest(request);
    setApproveName(request.category_name || '');
    setApproveParent('');
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    if (!approveName.trim()) {
      alert('Category name is required.');
      return;
    }
    try {
      await api.post(`/admin/category-requests/${selectedRequest.id}/approve`, {
        name: approveName.trim(),
        parent_id: approveParent || null
      });
      setSelectedRequest(null);
      await fetchData();
    } catch {
      alert('Failed to approve request.');
    }
  };

  const handleReject = async (requestId) => {
    const confirmed = window.confirm('Reject this request?');
    if (!confirmed) return;
    try {
      await api.delete(`/admin/category-requests/${requestId}/reject`);
      await fetchData();
    } catch {
      alert('Failed to reject request.');
    }
  };

  return (
    <Layout>
      <div className="w-full">
        <div className="mb-4 lg:mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FDF0F3] flex items-center justify-center">
            <ClipboardList size={20} className="text-[#89273B]" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Category Requests</h1>
            <p className="text-sm text-gray-500">Approve or reject requested categories</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl lg:rounded-3xl p-4 lg:p-8 shadow-sm border border-gray-100 w-full">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg lg:text-xl font-bold text-gray-800">Pending Requests</h3>
            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {requests.length} Total
            </span>
          </div>

          {isLoading ? (
            <div className="text-gray-500 text-sm">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="text-left text-gray-500 text-xs sm:text-sm border-b border-gray-100">
                    <th className="pb-3 lg:pb-4 font-medium pl-2 sm:pl-4">Requester</th>
                    <th className="pb-3 lg:pb-4 font-medium hidden sm:table-cell">Email</th>
                    <th className="pb-3 lg:pb-4 font-medium">Category</th>
                    <th className="pb-3 lg:pb-4 font-medium hidden lg:table-cell">Description</th>
                    <th className="pb-3 lg:pb-4 font-medium hidden md:table-cell">Date</th>
                    <th className="pb-3 lg:pb-4 font-medium text-right pr-2 sm:pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-xs sm:text-sm">
                  {requests.map((item) => (
                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-3 lg:py-4 pl-2 sm:pl-4 font-medium text-gray-900">
                        {item.profiles?.full_name || 'Unknown'}
                      </td>
                      <td className="py-3 lg:py-4 text-gray-600 hidden sm:table-cell">
                        {item.profiles?.email || '—'}
                      </td>
                      <td className="py-3 lg:py-4 text-gray-600 font-medium">
                        {item.category_name}
                      </td>
                      <td className="py-3 lg:py-4 text-gray-500 hidden lg:table-cell">
                        {item.description || '—'}
                      </td>
                      <td className="py-3 lg:py-4 text-gray-600 hidden md:table-cell whitespace-nowrap">
                        {item.created_at ? format(new Date(item.created_at), 'd MMM yyyy') : '—'}
                      </td>
                      <td className="py-3 lg:py-4 pr-2 sm:pr-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openApproveModal(item)}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-[#89273B] text-white rounded-lg text-xs font-semibold hover:bg-[#722030] transition-colors"
                          >
                            <CheckCircle size={14} />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(item.id)}
                            className="inline-flex items-center gap-2 px-3 py-2 border border-red-200 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-50 transition-colors"
                          >
                            <X size={14} />
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {requests.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center py-6 lg:py-8 text-gray-500 text-xs lg:text-sm">
                        No pending category requests.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selectedRequest && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setSelectedRequest(null)}></div>
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">Approve Category</h3>
                <button onClick={() => setSelectedRequest(null)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 font-medium uppercase">Category Name</label>
                  <input
                    value={approveName}
                    onChange={(e) => setApproveName(e.target.value)}
                    className="w-full mt-2 p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#89273B]"
                    placeholder="Category name"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-medium uppercase">Parent Category</label>
                  <select
                    value={approveParent}
                    onChange={(e) => setApproveParent(e.target.value)}
                    className="w-full mt-2 p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#89273B] bg-white"
                  >
                    <option value="">No parent</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-lg font-semibold text-sm hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApprove}
                    className="flex-1 py-2.5 bg-[#89273B] text-white rounded-lg font-semibold text-sm hover:bg-[#722030] transition-colors shadow-lg shadow-red-900/20"
                  >
                    Approve Request
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
};

export default Requests;
