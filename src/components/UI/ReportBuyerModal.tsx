import React, { useState } from 'react';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatPrice } from '../../utils/formatters';
import { FiX, FiUser, FiPackage, FiAlertTriangle } from 'react-icons/fi';

interface ReportBuyerModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  onReportSubmitted: () => void;
}

// Helper function to get buyer name from order
const getBuyerName = (order: any): string => {
  // First try to get name from buyerInfo (firstName + lastName)
  if (order.buyerInfo?.firstName || order.buyerInfo?.lastName) {
    const firstName = order.buyerInfo.firstName || '';
    const lastName = order.buyerInfo.lastName || '';
    return `${firstName} ${lastName}`.trim();
  }
  
  // Fallback to buyerName or buyerId
  return order.buyerName || order.buyerId || 'Unknown Buyer';
};

export default function ReportBuyerModal({ isOpen, onClose, order, onReportSubmitted }: ReportBuyerModalProps) {
  const [complaint, setComplaint] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!complaint.trim()) {
      showToast('error', 'Please enter a complaint');
      return;
    }

    if (complaint.trim().length < 10) {
      showToast('error', 'Complaint must be at least 10 characters long');
      return;
    }

    setSubmitting(true);

    try {
      // Check if seller has already reported this buyer for this order
      const existingReportQuery = query(
        collection(db, 'buyerReports'),
        where('orderId', '==', order.id),
        where('sellerId', '==', user?.uid)
      );
      
      const existingReports = await getDocs(existingReportQuery);
      
      if (!existingReports.empty) {
        showToast('error', 'You have already reported this buyer for this order');
        setSubmitting(false);
        return;
      }

      // Create the report
      const reportData = {
        orderId: order.id || '',
        sellerId: user?.uid || '',
        sellerName: user?.displayName || 'Unknown Seller',
        buyerId: order.buyerId || '',
        buyerName: getBuyerName(order),
        buyerEmail: order.buyerEmail || '',
        complaint: complaint.trim(),
        orderDetails: {
          itemName: order.itemName || 'Unknown Item',
          itemPrice: order.itemPrice || order.price || 0,
          total: order.total || 0,
          status: order.status || 'Unknown',
          createdAt: order.createdAt || null,
          paymentMethod: order.paymentMethod || 'Unknown'
        },
        reportedAt: new Date(),
        status: 'pending', // pending, reviewed, resolved
        adminNotes: ''
      };

      await addDoc(collection(db, 'buyerReports'), reportData);
      
      showToast('success', 'Buyer reported successfully. Our team will review this report.');
      onReportSubmitted();
      onClose();
    } catch (error) {
      console.error('Error reporting buyer:', error);
      showToast('error', 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <FiAlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Report Buyer</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            disabled={submitting}
          >
            <FiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[calc(90vh-140px)] overflow-y-auto">
          {/* Buyer Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <FiUser className="w-4 h-4 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Buyer Information</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Name:</span> {getBuyerName(order)}</div>
              <div><span className="font-medium">Email:</span> {order.buyerEmail || 'Not provided'}</div>
              <div><span className="font-medium">Buyer ID:</span> {order.buyerId || 'Unknown'}</div>
            </div>
          </div>

          {/* Order Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <FiPackage className="w-4 h-4 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Order Information</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Order ID:</span> {order.id || 'Unknown'}</div>
              <div><span className="font-medium">Item:</span> {order.itemName || 'Unknown Item'}</div>
              <div><span className="font-medium">Total:</span> {formatPrice(order.total)}</div>
              <div><span className="font-medium">Status:</span> {order.status || 'Unknown'}</div>
              <div><span className="font-medium">Payment Method:</span> {order.paymentMethod || 'Unknown'}</div>
              {order.createdAt && (
                <div>
                  <span className="font-medium">Order Date:</span>{' '}
                  {new Date(order.createdAt.seconds ? order.createdAt.seconds * 1000 : order.createdAt).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>

          {/* Complaint Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="complaint" className="block text-sm font-medium text-gray-700 mb-2">
                Complaint Details *
              </label>
              <textarea
                id="complaint"
                value={complaint}
                onChange={(e) => setComplaint(e.target.value)}
                placeholder="Please describe the issue with this buyer in detail. Include any relevant information about communication problems, payment issues, or inappropriate behavior..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={6}
                disabled={submitting}
                required
              />
              <div className="mt-1 text-xs text-gray-500">
                Minimum 10 characters. {complaint.length}/500 characters
              </div>
            </div>

            {/* Warning Message */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <FiAlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-yellow-800">
                  <p className="font-medium mb-1">Important Notice:</p>
                  <p>
                    Please only report buyers for legitimate issues such as inappropriate behavior, 
                    payment problems, or violation of marketplace policies. False reports may result 
                    in action against your seller account.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={submitting || complaint.trim().length < 10}
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
