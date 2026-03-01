import React, { useState, useEffect } from 'react';
import { paymentAPI } from '../services/api';
import { FaCheck, FaTimes, FaEye, FaSearch } from 'react-icons/fa';

const PaymentManagementPage = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPaymentGroup, setSelectedPaymentGroup] = useState(null);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [verifying, setVerifying] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectionInput, setShowRejectionInput] = useState(false);

    const [theme] = useState(() => {
        try {
            return localStorage.getItem('uiTheme') === 'light' ? 'light' : 'dark';
        } catch {
            return 'dark';
        }
    });
    const isLightMode = theme === 'light';

    const loadPayments = async () => {
        setLoading(true);
        try {
            const res = await paymentAPI.getAllPayments();
            setPayments(res.data || []);
        } catch (err) {
            setError('Failed to load payments');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPayments();
    }, []);

    const handleVerify = async (id, status) => {
        if (status === 'rejected' && !showRejectionInput && selectedPayment?.userId) {
            setShowRejectionInput(true);
            return;
        }

        setVerifying(true);
        try {
            await paymentAPI.verifyPayment(id, {
                status,
                rejectionReason: status === 'rejected' ? rejectionReason : undefined
            });
            setShowRejectionInput(false);
            setRejectionReason('');
            setSelectedPayment(null);
            setSelectedPaymentGroup(null);
            await loadPayments();
        } catch (err) {
            alert(err.response?.data?.message || 'Verification failed');
        } finally {
            setVerifying(false);
        }
    };

    const handleDeleteRecord = async (id) => {
        if (!window.confirm('Are you sure you want to permanently delete this payment record? This is usually only done for orphaned records where the student account no longer exists.')) {
            return;
        }

        setVerifying(true);
        try {
            await paymentAPI.deletePayment(id);
            setSelectedPaymentGroup(null);
            setSelectedPayment(null);
            await loadPayments();
        } catch (err) {
            alert(err.response?.data?.message || 'Deletion failed');
        } finally {
            setVerifying(false);
        }
    };

    const filteredRawPayments = React.useMemo(() => {
        return payments.filter(p => {
            const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
            const matchesSearch = !searchTerm ||
                p.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.utrNumber?.includes(searchTerm) ||
                p.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesStatus && matchesSearch;
        });
    }, [payments, filterStatus, searchTerm]);

    const groupedPayments = React.useMemo(() => {
        const groups = {};

        filteredRawPayments.forEach(p => {
            const usn = p.studentId || p.userId?.usn || 'Unknown';
            if (!groups[usn]) {
                groups[usn] = {
                    studentId: usn,
                    name: p.userId?.name || 'Deleted User',
                    userId: p.userId,
                    history: []
                };
            }
            groups[usn].history.push(p);
        });

        return Object.values(groups).map(g => {
            // Sort history by newest first
            g.history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            const latest = g.history[0];
            return {
                ...g,
                latestStatus: latest.status,
                lastPaymentDate: latest.createdAt,
                totalAttempts: g.history.length,
                latestPayment: latest
            };
        });
    }, [filteredRawPayments]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className={`text-2xl font-bold ${isLightMode ? 'text-gray-900' : 'text-white'}`}>
                        Payment Management
                    </h1>
                    <p className={`text-sm mt-1 ${isLightMode ? 'text-gray-600' : 'text-gray-400'}`}>
                        Verify manual UPI payments and activate ASK+ subscriptions
                    </p>
                </div>
                <div className={`text-sm font-semibold px-3 py-1 rounded-full ${isLightMode ? 'bg-blue-100 text-blue-700' : 'bg-blue-500/20 text-blue-400'}`}>
                    {payments.filter(p => p.status === 'pending').length} Pending
                </div>
            </div>

            {/* Filters */}
            <div className={`p-4 rounded-xl border ${isLightMode ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'} flex flex-wrap gap-4`}>
                <div className="flex-1 min-w-[200px] relative">
                    <FaSearch className="absolute left-3 top-3 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search USN, Name, UTR..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2 rounded-lg border outline-none text-sm transition ${isLightMode
                            ? 'bg-gray-50 border-gray-200 focus:border-blue-500'
                            : 'bg-gray-900 border-gray-600 focus:border-blue-500 text-white'}`}
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className={`px-4 py-2 rounded-lg border outline-none text-sm ${isLightMode
                        ? 'bg-white border-gray-200'
                        : 'bg-gray-900 border-gray-600 text-white'}`}
                >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                </select>
            </div>

            {/* Table */}
            <div className={`rounded-xl border overflow-hidden ${isLightMode ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
                {loading ? (
                    <div className="p-12 text-center text-gray-500">Loading payments...</div>
                ) : groupedPayments.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">No payments found.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className={isLightMode ? 'bg-gray-50 text-gray-700' : 'bg-gray-900/50 text-gray-300'}>
                                <tr className="border-b border-gray-700">
                                    <th className="px-6 py-4 text-left font-semibold">Student ID</th>
                                    <th className="px-6 py-4 text-left font-semibold">Name</th>
                                    <th className="px-6 py-4 text-left font-semibold">Latest Status</th>
                                    <th className="px-6 py-4 text-left font-semibold">Last Date</th>
                                    <th className="px-6 py-4 text-center font-semibold">Attempts</th>
                                    <th className="px-6 py-4 text-right font-semibold">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {groupedPayments.map(g => (
                                    <tr key={g.studentId} className={isLightMode ? 'hover:bg-gray-50' : 'hover:bg-white/5'}>
                                        <td className="px-6 py-4 font-mono font-bold text-blue-400">{g.studentId}</td>
                                        <td className="px-6 py-4 font-medium text-white">
                                            {g.userId?.name || (
                                                <span className="text-red-400 flex items-center gap-1">
                                                    <FaTimes className="text-[10px]" /> Deleted User
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${g.latestStatus === 'approved' ? 'bg-green-500/20 text-green-400' :
                                                g.latestStatus === 'rejected' ? 'bg-red-500/20 text-red-400' :
                                                    'bg-yellow-500/20 text-yellow-400'
                                                }`}>
                                                {g.latestStatus}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-400">{new Date(g.lastPaymentDate).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${isLightMode ? 'bg-gray-100 text-gray-600' : 'bg-gray-700 text-gray-300'}`}>
                                                {g.totalAttempts}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setSelectedPaymentGroup(g)}
                                                className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition flex items-center gap-2 ml-auto"
                                            >
                                                <FaEye /> View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {selectedPaymentGroup && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className={`w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border ${isLightMode ? 'bg-white border-gray-200' : 'bg-gray-900 border-gray-700'}`}>
                        {/* Header */}
                        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900">
                            <div>
                                <h2 className="text-xl font-bold text-white">Student Payment Profile</h2>
                                <p className="text-sm text-gray-400">{selectedPaymentGroup.name} • {selectedPaymentGroup.studentId}</p>
                            </div>
                            <button onClick={() => { setSelectedPaymentGroup(null); setSelectedPayment(null); setShowRejectionInput(false); }} className="text-gray-400 hover:text-white p-2">
                                <FaTimes />
                            </button>
                        </div>

                        <div className="flex flex-col sm:flex-row h-[450px]">
                            {/* Left: History List */}
                            <div className="w-full sm:w-1/3 border-r border-gray-800 overflow-y-auto bg-gray-900/50">
                                <div className="p-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-gray-800">
                                    Payment History ({selectedPaymentGroup.totalAttempts})
                                </div>
                                {selectedPaymentGroup.history.map((p) => (
                                    <button
                                        key={p._id}
                                        onClick={() => { setSelectedPayment(p); setShowRejectionInput(false); }}
                                        className={`w-full p-4 text-left border-b border-gray-800 transition ${selectedPayment?._id === p._id ? 'bg-blue-500/10 border-l-4 border-l-blue-500' : 'hover:bg-white/5'}`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-[10px] text-gray-400 font-mono">{p.utrNumber.slice(-6)}...</span>
                                            <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${p.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                                                    p.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                                                        p.status === 'expired' ? 'bg-gray-500/20 text-gray-400' :
                                                            'bg-yellow-500/20 text-yellow-400'
                                                }`}>
                                                {p.status}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-300 font-medium">₹{p.amount || 29}</div>
                                        <div className="text-[10px] text-gray-500 mt-1">{new Date(p.createdAt).toLocaleDateString()}</div>
                                    </button>
                                ))}
                            </div>

                            {/* Right: Selected Payment Detail */}
                            <div className="flex-1 p-6 overflow-y-auto">
                                {!selectedPayment ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-8 grayscale opacity-50">
                                        <FaEye className="text-4xl mb-4 text-gray-600" />
                                        <p className="text-sm text-gray-500">Select a payment from the left to view details and take actions.</p>
                                    </div>
                                ) : (
                                    <div className="animate-in fade-in duration-300">
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-2 gap-y-4">
                                                <div>
                                                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">UTR Number</div>
                                                    <div className="text-white font-mono text-sm">{selectedPayment.utrNumber}</div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Plan / Amount</div>
                                                    <div className="text-white font-bold text-sm">₹{selectedPayment.amount || 29} • {selectedPayment.plan?.toUpperCase() || 'ASKPLUS'}</div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Status</div>
                                                    <div className={`text-sm font-bold uppercase ${selectedPayment.status === 'approved' ? 'text-green-400' :
                                                            selectedPayment.status === 'rejected' ? 'text-red-400' :
                                                                'text-yellow-400'
                                                        }`}>{selectedPayment.status}</div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Submitted</div>
                                                    <div className="text-gray-300 text-sm">{new Date(selectedPayment.createdAt).toLocaleString()}</div>
                                                </div>
                                            </div>

                                            {selectedPayment.status === 'rejected' && selectedPayment.rejectionReason && (
                                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                                    <div className="text-xs text-red-400 font-bold mb-1">Rejection Reason</div>
                                                    <p className="text-sm text-red-300/80 italic">"{selectedPayment.rejectionReason}"</p>
                                                </div>
                                            )}

                                            {showRejectionInput && (
                                                <div className="animate-in slide-in-from-top duration-300">
                                                    <label className="block text-xs font-bold text-red-400 uppercase mb-2">Rejection Reason</label>
                                                    <textarea
                                                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white text-sm outline-none focus:border-red-500"
                                                        placeholder="Enter reason for rejection..."
                                                        value={rejectionReason}
                                                        onChange={(e) => setRejectionReason(e.target.value)}
                                                        rows={3}
                                                    />
                                                </div>
                                            )}

                                            {selectedPayment.status === 'pending' && (
                                                <div className="space-y-4 pt-4 border-t border-gray-800">
                                                    {!selectedPaymentGroup.userId && (
                                                        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                                                            Student account deleted. Only rejection or deletion allowed.
                                                        </div>
                                                    )}
                                                    <div className="flex gap-4">
                                                        <button
                                                            disabled={verifying}
                                                            onClick={() => handleVerify(selectedPayment._id, 'rejected')}
                                                            className="flex-1 bg-red-500/10 text-red-500 py-2.5 rounded-xl font-bold hover:bg-red-500 hover:text-white transition text-xs"
                                                        >
                                                            {showRejectionInput ? 'Confirm Reject' : 'Reject'}
                                                        </button>
                                                        {selectedPaymentGroup.userId ? (
                                                            <button
                                                                disabled={verifying}
                                                                onClick={() => handleVerify(selectedPayment._id, 'approved')}
                                                                className="flex-1 bg-green-600 text-white py-2.5 rounded-xl font-bold hover:bg-green-700 transition text-xs"
                                                            >
                                                                {verifying ? 'Verifying...' : 'Approve'}
                                                            </button>
                                                        ) : (
                                                            <button
                                                                disabled={verifying}
                                                                onClick={() => handleDeleteRecord(selectedPayment._id)}
                                                                className="flex-1 bg-gray-500/10 text-gray-400 py-2.5 rounded-xl font-bold hover:bg-gray-500 hover:text-white transition text-xs border border-gray-500/20"
                                                            >
                                                                Delete
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentManagementPage;
