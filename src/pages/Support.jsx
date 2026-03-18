import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../lib/axios';
import { LifeBuoy, X, Send, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Support = () => {
  const [activeTab, setActiveTab] = useState('tickets');
  const [tickets, setTickets] = useState([]);
  const [reports, setReports] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [reply, setReply] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [ticketsRes, reportsRes] = await Promise.all([
        api.get('/admin/support'),
        api.get('/admin/reports')
      ]);
      setTickets(ticketsRes.data || []);
      setReports(reportsRes.data || []);
    } catch (error) {
      console.error('Support fetch error', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReply = async () => {
    if (!selectedTicket || !reply.trim()) return;
    try {
      await api.put(`/admin/support/${selectedTicket.id}/reply`, { reply });
      setSelectedTicket(null);
      setReply('');
      fetchData();
    } catch {
      alert('Failed to send reply');
    }
  };

  const handleResolve = async (reportId) => {
    try {
      await api.put(`/admin/reports/${reportId}/resolve`, {});
      fetchData();
    } catch {
      alert('Failed to resolve report');
    }
  };

  const statusBadge = (status) => {
    if (status === 'closed' || status === 'resolved') {
      return 'bg-green-100 text-green-700';
    }
    return 'bg-yellow-100 text-yellow-700';
  };

  return (
    <Layout>
      <div className="w-full">
        <div className="mb-4 lg:mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FDF0F3] flex items-center justify-center">
            <LifeBuoy size={20} className="text-[#89273B]" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Support</h1>
            <p className="text-sm text-gray-500">Tickets and user reports</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl lg:rounded-3xl p-4 lg:p-8 shadow-sm border border-gray-100 w-full">
          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={() => setActiveTab('tickets')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                activeTab === 'tickets'
                  ? 'bg-[#89273B] text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Tickets
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                activeTab === 'reports'
                  ? 'bg-[#89273B] text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Reports
            </button>
          </div>

          {isLoading ? (
            <div className="text-gray-500 text-sm">Loading...</div>
          ) : activeTab === 'tickets' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="text-left text-gray-500 text-xs sm:text-sm border-b border-gray-100">
                    <th className="pb-3 lg:pb-4 font-medium pl-2 sm:pl-4">User</th>
                    <th className="pb-3 lg:pb-4 font-medium">Subject</th>
                    <th className="pb-3 lg:pb-4 font-medium hidden md:table-cell">Status</th>
                    <th className="pb-3 lg:pb-4 font-medium hidden lg:table-cell">Created</th>
                  </tr>
                </thead>
                <tbody className="text-xs sm:text-sm">
                  {tickets.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => {
                        setSelectedTicket(item);
                        setReply(item.admin_reply || '');
                      }}
                      className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 lg:py-4 pl-2 sm:pl-4 font-medium text-gray-900">
                        {item.profiles?.full_name || 'Unknown'}
                      </td>
                      <td className="py-3 lg:py-4 text-gray-600">
                        {item.subject}
                      </td>
                      <td className="py-3 lg:py-4 hidden md:table-cell">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusBadge(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 lg:py-4 text-gray-600 hidden lg:table-cell whitespace-nowrap">
                        {item.created_at?.split('T')[0]}
                      </td>
                    </tr>
                  ))}
                  {tickets.length === 0 && (
                    <tr>
                      <td
                        colSpan="4"
                        className="text-center py-6 lg:py-8 text-gray-500 text-xs lg:text-sm"
                      >
                        No support tickets found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="text-left text-gray-500 text-xs sm:text-sm border-b border-gray-100">
                    <th className="pb-3 lg:pb-4 font-medium pl-2 sm:pl-4">Reporter</th>
                    <th className="pb-3 lg:pb-4 font-medium">Reported User</th>
                    <th className="pb-3 lg:pb-4 font-medium hidden md:table-cell">Reason</th>
                    <th className="pb-3 lg:pb-4 font-medium">Status</th>
                    <th className="pb-3 lg:pb-4 font-medium text-right pr-2 sm:pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-xs sm:text-sm">
                  {reports.map((item) => (
                    <tr key={item.id} className="border-b border-gray-50">
                      <td className="py-3 lg:py-4 pl-2 sm:pl-4 font-medium text-gray-900">
                        {item.reporter?.full_name || 'Unknown'}
                      </td>
                      <td className="py-3 lg:py-4 text-gray-600">
                        {item.reported?.full_name || 'Unknown'}
                      </td>
                      <td className="py-3 lg:py-4 text-gray-600 hidden md:table-cell">
                        {item.reason}
                      </td>
                      <td className="py-3 lg:py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusBadge(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 lg:py-4 pr-2 sm:pr-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              navigate(`/users?focus=${item.reported_user_id}`)
                            }
                            className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors"
                          >
                            <UserRound size={14} />
                            View User
                          </button>
                          <button
                            onClick={() => handleResolve(item.id)}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-[#89273B] text-white rounded-lg text-xs font-semibold hover:bg-[#722030] transition-colors"
                          >
                            Resolve
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {reports.length === 0 && (
                    <tr>
                      <td
                        colSpan="5"
                        className="text-center py-6 lg:py-8 text-gray-500 text-xs lg:text-sm"
                      >
                        No reports found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div
          className={`fixed inset-y-0 right-0 w-full sm:w-[420px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
            selectedTicket ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {selectedTicket && (
            <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold">Ticket Reply</h3>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <p className="text-xs text-gray-400 font-medium uppercase">User</p>
                <p className="font-medium text-sm mt-1">
                  {selectedTicket.profiles?.full_name || 'Unknown'}
                </p>
                <p className="text-xs text-gray-400 font-medium uppercase mt-4">Message</p>
                <p className="text-sm text-gray-700 mt-1">{selectedTicket.message}</p>
                <p className="text-xs text-gray-400 font-medium uppercase mt-4">Reply</p>
                <textarea
                  className="w-full mt-2 p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#89273B]"
                  rows="5"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Write a reply..."
                ></textarea>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <button
                  onClick={handleReply}
                  className="w-full py-3 bg-[#89273B] text-white rounded-lg font-semibold text-sm hover:bg-[#722030] transition-colors flex items-center justify-center gap-2"
                >
                  <Send size={16} />
                  Send Reply & Close
                </button>
              </div>
            </div>
          )}
        </div>

        {selectedTicket && (
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setSelectedTicket(null)}
          ></div>
        )}
      </div>
    </Layout>
  );
};

export default Support;
