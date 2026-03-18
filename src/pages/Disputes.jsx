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

  const handleResolve = async (disputeId, verdict) => {
    const confirmed = window.confirm('Resolve this dispute?');
    if (!confirmed) return;
    try {
      await api.post(`/admin/disputes/${disputeId}/resolve`, { verdict });
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
                  key={item.id}
                  className="border border-gray-100 rounded-2xl p-4 lg:p-6 bg-[#FAFAFA]"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase">Booking ID</p>
                      <p className="text-sm font-semibold text-gray-800">
                        {item.booking_id}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400 font-medium uppercase">Amount</p>
                      <p className="text-sm font-semibold text-[#89273B]">
                        ${item.bookings?.total_price || 0}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-gray-400 font-medium uppercase">Reason</p>
                    <p className="text-sm text-gray-700 mt-1">{item.reason}</p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => handleResolve(item.id, 'refund_client')}
                      className="flex-1 py-2.5 border border-red-200 text-red-600 rounded-xl text-xs sm:text-sm font-semibold hover:bg-red-50 transition-colors"
                    >
                      Force Refund Client
                    </button>
                    <button
                      onClick={() => handleResolve(item.id, 'pay_provider')}
                      className="flex-1 py-2.5 bg-[#89273B] text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-[#722030] transition-colors shadow-lg shadow-red-900/20"
                    >
                      Force Pay Provider
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
