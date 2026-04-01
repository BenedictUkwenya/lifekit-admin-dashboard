import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../lib/axios';
import { AlertTriangle } from 'lucide-react';

const Disputes = () => {
  const [disputes, setDisputes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDisputes = async () => {
    try {
      const res = await api.get('/admin/disputes');
      setDisputes(res.data || []);
    } catch (error) {
      console.error('Disputes fetch error', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const handleResolve = async (bookingId, verdict) => {
    const confirmed = window.confirm('Resolve this dispute?');
    if (!confirmed) return;
    try {
      await api.post(`/admin/disputes/${bookingId}/resolve`, { verdict });
      fetchDisputes();
    } catch (error) {
      console.error('Resolve dispute error', error);
      alert('Failed to resolve dispute');
    }
  };

  return (
    <Layout>
      <div className="w-full">
        <div className="mb-4 lg:mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FDF0F3] flex items-center justify-center">
            <AlertTriangle size={20} className="text-[#89273B]" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Disputes</h1>
            <p className="text-sm text-gray-500">Open booking disputes</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl lg:rounded-3xl p-4 lg:p-8 shadow-sm border border-gray-100 w-full">
          {isLoading ? (
            <div className="text-gray-500 text-sm">Loading...</div>
          ) : disputes.length === 0 ? (
            <div className="text-gray-500 text-sm">No open disputes found.</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {disputes.map((item) => (
                <div
                  key={item.booking_id}
                  className="border border-gray-100 rounded-2xl p-4 lg:p-6 bg-[#FAFAFA]"
                >
                  {/* Header row: Booking ID + Amount */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase">Booking ID</p>
                      <p className="text-sm font-semibold text-gray-800 font-mono">
                        {item.booking_id?.slice(0, 8)}…
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400 font-medium uppercase">Amount at Stake</p>
                      <p className="text-sm font-semibold text-[#89273B]">
                        ${item.bookings?.total_price || 0}
                      </p>
                    </div>
                  </div>

                  {/* Service title */}
                  {item.bookings?.services?.title && (
                    <p className="text-xs text-gray-500 mb-3">
                      📋 <span className="font-semibold">{item.bookings.services.title}</span>
                    </p>
                  )}

                  {/* Dispute reason */}
                  <div className="mb-4 bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <p className="text-xs text-gray-400 font-medium uppercase mb-1">Dispute Reason</p>
                    <p className="text-sm text-gray-700 italic">
                      {item.reason || 'No reason provided — booking was set to disputed directly.'}
                    </p>
                  </div>

                  {/* Confirmation context badges */}
                  <div className="mb-4 flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${item.bookings?.provider_confirmed ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}>
                      Provider Confirmed: {item.bookings?.provider_confirmed ? '✓ Yes' : '✗ No'}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${item.bookings?.client_confirmed ? 'bg-green-100 text-green-700' : 'bg-orange-50 text-orange-600'}`}>
                      Client Confirmed: {item.bookings?.client_confirmed ? '✓ Yes' : '✗ No'}
                    </span>
                    {!item.dispute_id && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700">
                        ⚠ No Formal Dispute Record
                      </span>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => handleResolve(item.booking_id, 'refund_client')}
                      className="flex-1 py-2.5 border border-red-200 text-red-600 rounded-xl text-xs sm:text-sm font-semibold hover:bg-red-50 transition-colors"
                    >
                      Force Refund Client
                    </button>
                    <button
                      onClick={() => handleResolve(item.booking_id, 'pay_provider')}
                      className="flex-1 py-2.5 bg-[#89273B] text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-[#722030] transition-colors shadow-lg shadow-red-900/20"
                    >
                      Force Pay Provider
                    </button>
                    <button
                      onClick={() => alert(`Chat log review for booking ${item.booking_id} — connect this to your chat viewer.`)}
                      className="flex-1 py-2.5 border border-gray-200 text-gray-500 rounded-xl text-xs sm:text-sm font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
                      title="View chat history for this booking"
                    >
                      💬 View Chat Logs
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Disputes;
