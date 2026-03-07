import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../lib/axios';
import { Users, Ban, PauseCircle, AlertTriangle, X } from 'lucide-react';

const UserMonitor = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [warnUser, setWarnUser] = useState(null);
  const [warningMessage, setWarningMessage] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users/all');
      setUsers(res.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleStatusUpdate = async (userId, status) => {
    const confirmed = window.confirm(`Set user status to ${status}?`);
    if (!confirmed) return;
    try {
      await api.put(`/admin/users/${userId}/status`, { status });
      await fetchUsers();
    } catch {
      alert('Failed to update status.');
    }
  };

  const handleSendWarning = async () => {
    if (!warnUser) return;
    if (!warningMessage.trim()) {
      alert('Please enter a warning message.');
      return;
    }
    try {
      await api.post('/admin/notifications/send', {
        user_id: warnUser.id,
        message: warningMessage.trim(),
        title: 'Warning from Admin'
      });
      setWarnUser(null);
      setWarningMessage('');
    } catch {
      alert('Failed to send warning.');
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'suspended':
        return 'bg-yellow-100 text-yellow-700';
      case 'blocked':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Layout>
      <div className="w-full">
        <div className="mb-4 lg:mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FDF0F3] flex items-center justify-center">
            <Users size={20} className="text-[#89273B]" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">User Monitor</h1>
            <p className="text-sm text-gray-500">Manage user access and warnings</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl lg:rounded-3xl p-4 lg:p-8 shadow-sm border border-gray-100 w-full">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg lg:text-xl font-bold text-gray-800">All Users</h3>
            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {users.length} Total
            </span>
          </div>

          {isLoading ? (
            <div className="text-gray-500 text-sm">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="text-left text-gray-500 text-xs sm:text-sm border-b border-gray-100">
                    <th className="pb-3 lg:pb-4 font-medium pl-2 sm:pl-4">Name</th>
                    <th className="pb-3 lg:pb-4 font-medium hidden sm:table-cell">Email</th>
                    <th className="pb-3 lg:pb-4 font-medium hidden md:table-cell">Role</th>
                    <th className="pb-3 lg:pb-4 font-medium">Status</th>
                    <th className="pb-3 lg:pb-4 font-medium text-right pr-2 sm:pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-xs sm:text-sm">
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-3 lg:py-4 pl-2 sm:pl-4 font-medium text-gray-900">
                        {user.full_name || 'Unknown'}
                      </td>
                      <td className="py-3 lg:py-4 text-gray-600 hidden sm:table-cell">
                        {user.email || '—'}
                      </td>
                      <td className="py-3 lg:py-4 text-gray-600 hidden md:table-cell">
                        {user.role || 'user'}
                      </td>
                      <td className="py-3 lg:py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusStyle(user.status)}`}>
                          {(user.status || 'unknown').toString().charAt(0).toUpperCase() + (user.status || 'unknown').toString().slice(1)}
                        </span>
                      </td>
                      <td className="py-3 lg:py-4 pr-2 sm:pr-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleStatusUpdate(user.id, 'blocked')}
                            className="inline-flex items-center gap-2 px-3 py-2 border border-red-200 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-50 transition-colors"
                          >
                            <Ban size={14} />
                            Block
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(user.id, 'suspended')}
                            className="inline-flex items-center gap-2 px-3 py-2 border border-yellow-200 text-yellow-700 rounded-lg text-xs font-semibold hover:bg-yellow-50 transition-colors"
                          >
                            <PauseCircle size={14} />
                            Suspend
                          </button>
                          <button
                            onClick={() => {
                              setWarnUser(user);
                              setWarningMessage('');
                            }}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-[#89273B] text-white rounded-lg text-xs font-semibold hover:bg-[#722030] transition-colors"
                          >
                            <AlertTriangle size={14} />
                            Warn
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-6 lg:py-8 text-gray-500 text-xs lg:text-sm">
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {warnUser && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setWarnUser(null)}></div>
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Send Warning</h3>
                  <p className="text-xs text-gray-500">To {warnUser.full_name || warnUser.email}</p>
                </div>
                <button onClick={() => setWarnUser(null)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X size={18} />
                </button>
              </div>
              <textarea
                className="w-full mt-2 p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#89273B]"
                rows="4"
                placeholder="Write your warning message..."
                value={warningMessage}
                onChange={(e) => setWarningMessage(e.target.value)}
              ></textarea>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setWarnUser(null)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-lg font-semibold text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendWarning}
                  className="flex-1 py-2.5 bg-[#89273B] text-white rounded-lg font-semibold text-sm hover:bg-[#722030] transition-colors shadow-lg shadow-red-900/20"
                >
                  Send Warning
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
};

export default UserMonitor;
