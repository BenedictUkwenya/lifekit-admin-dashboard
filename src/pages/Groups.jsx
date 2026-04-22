import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Users, Trash2, Search, MessageSquare, Shield, RefreshCw } from 'lucide-react';
import api from '../lib/axios';
import { format } from 'date-fns';

const Groups = () => {
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/feeds/groups');
      // Backend returns groups array — enrich with member/post counts if present
      setGroups(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Failed to load groups', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete the community "${name}"?\n\nThis will permanently remove the group and all its posts.`)) return;
    setDeletingId(id);
    try {
      await api.delete(`/feeds/groups/admin/${id}`);
      setGroups(prev => prev.filter(g => g.id !== id));
    } catch (error) {
      alert('Failed to delete group: ' + (error.response?.data?.error || error.message));
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = groups.filter(g =>
    (g.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (g.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Communities</h1>
            <p className="text-sm text-gray-500 mt-1">
              {groups.length} group{groups.length !== 1 ? 's' : ''} total
            </p>
          </div>
          <button
            onClick={fetchGroups}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors self-start sm:self-auto"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
          <input
            type="text"
            placeholder="Search communities..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#89273B]/20 shadow-sm"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-24 text-gray-400">
              <div className="animate-spin w-6 h-6 border-2 border-[#89273B] border-t-transparent rounded-full mr-3" />
              Loading communities...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <Users size={40} className="mb-4 opacity-30" />
              <p className="font-medium">
                {searchQuery ? `No communities match "${searchQuery}"` : 'No communities yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Community</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-4 hidden sm:table-cell">Members</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-4 hidden md:table-cell">Posting</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-4 hidden lg:table-cell">Created</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(group => (
                    <tr key={group.id} className="hover:bg-gray-50/50 transition-colors">
                      {/* Community info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {group.image_url ? (
                            <img
                              src={group.image_url}
                              alt={group.name}
                              className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-[#89273B]/10 flex items-center justify-center flex-shrink-0">
                              <Users size={18} className="text-[#89273B]" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-sm text-gray-800">{group.name}</p>
                            {group.description && (
                              <p className="text-xs text-gray-400 line-clamp-1 max-w-xs">{group.description}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Member count */}
                      <td className="px-4 py-4 hidden sm:table-cell">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Users size={14} className="text-gray-400" />
                          <span>{group.member_count ?? group.group_members?.length ?? '—'}</span>
                        </div>
                      </td>

                      {/* Posting policy */}
                      <td className="px-4 py-4 hidden md:table-cell">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                          group.anyone_can_post
                            ? 'bg-green-50 text-green-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {group.anyone_can_post ? (
                            <><MessageSquare size={11} /> Open</>
                          ) : (
                            <><Shield size={11} /> Admins only</>
                          )}
                        </span>
                      </td>

                      {/* Created at */}
                      <td className="px-4 py-4 hidden lg:table-cell">
                        <span className="text-sm text-gray-500">
                          {group.created_at
                            ? format(new Date(group.created_at), 'MMM d, yyyy')
                            : '—'}
                        </span>
                      </td>

                      {/* Delete */}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(group.id, group.name)}
                          disabled={deletingId === group.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                        >
                          {deletingId === group.id ? (
                            <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 size={13} />
                          )}
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Stats footer */}
        {!isLoading && groups.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Total Communities</p>
              <p className="text-2xl font-bold text-gray-800">{groups.length}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Open to Post</p>
              <p className="text-2xl font-bold text-gray-800">
                {groups.filter(g => g.anyone_can_post).length}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hidden sm:block">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Admin Only</p>
              <p className="text-2xl font-bold text-gray-800">
                {groups.filter(g => !g.anyone_can_post).length}
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Groups;
