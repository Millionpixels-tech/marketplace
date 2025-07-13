import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { getServiceRequestsForProviderPaginated, getServiceRequestsForCustomerPaginated, updateServiceRequestStatus } from "../../../utils/serviceRequests";
import { createServiceReview, hasUserReviewedServiceRequest } from "../../../utils/serviceReviews";
import type { ServiceRequest } from "../../../types/serviceRequest";
import { FiClock, FiUser, FiMail, FiFileText, FiDownload, FiPhone, FiX, FiStar } from "react-icons/fi";
import { useResponsive } from "../../../hooks/useResponsive";
import { useConfirmDialog } from "../../../hooks/useConfirmDialog";
import { ConfirmDialog, Pagination } from "../../../components/UI";
import type { DocumentSnapshot } from "firebase/firestore";

const SERVICE_REQUEST_SUBTABS = [
  { key: "sent", label: "Sent Requests" },
  { key: "received", label: "Received Requests" },
];

export default function ServiceRequestsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { isMobile } = useResponsive();
  const { isOpen, confirmDialog, showConfirmDialog, handleConfirm, handleCancel } = useConfirmDialog();
  const [sentRequests, setSentRequests] = useState<ServiceRequest[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [activeTab, setActiveTab] = useState<"sent" | "received">("sent");
  
  // Review state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  
  // Pagination state
  const [sentPage, setSentPage] = useState(1);
  const [receivedPage, setReceivedPage] = useState(1);
  const [sentLastVisible, setSentLastVisible] = useState<DocumentSnapshot>();
  const [receivedLastVisible, setReceivedLastVisible] = useState<DocumentSnapshot>();
  const [sentHasMore, setSentHasMore] = useState(false);
  const [receivedHasMore, setReceivedHasMore] = useState(false);
  
  const REQUESTS_PER_PAGE = 5;

  useEffect(() => {
    if (user) {
      fetchServiceRequests(1); // Load first page
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchServiceRequestsPage(1); // Load first page when tab changes
    }
  }, [activeTab, user]);

  const fetchServiceRequests = async (page: number) => {
    if (!user) return;
    
    try {
      const isFirstPage = page === 1;
      
      if (activeTab === "sent") {
        const lastVisible = isFirstPage ? undefined : sentLastVisible;
        const result = await getServiceRequestsForCustomerPaginated(
          user.uid,
          REQUESTS_PER_PAGE,
          lastVisible
        );
        
        setSentRequests(result.requests);
        setSentLastVisible(result.lastVisible);
        setSentHasMore(result.hasMore);
      } else {
        const lastVisible = isFirstPage ? undefined : receivedLastVisible;
        const result = await getServiceRequestsForProviderPaginated(
          user.uid,
          REQUESTS_PER_PAGE,
          lastVisible
        );
        
        setReceivedRequests(result.requests);
        setReceivedLastVisible(result.lastVisible);
        setReceivedHasMore(result.hasMore);
      }
    } catch (error) {
      console.error("Error fetching service requests:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch service requests for a specific page
  const fetchServiceRequestsPage = async (page: number) => {
    
    try {
      setLoading(true);
      
      if (activeTab === "sent") {
        
        // If going to page 1, reset cursor
        if (page === 1) {
          const result = await getServiceRequestsForCustomerPaginated(user!.uid, REQUESTS_PER_PAGE);
          setSentRequests(result.requests);
          setSentLastVisible(result.lastVisible);
          setSentHasMore(result.hasMore);
          setSentPage(1);
        } else if (page > sentPage) {
          const result = await getServiceRequestsForCustomerPaginated(user!.uid, REQUESTS_PER_PAGE, sentLastVisible);
          setSentRequests(result.requests);
          setSentLastVisible(result.lastVisible);
          setSentHasMore(result.hasMore);
          setSentPage(page);
        } else {
          console.log('Cannot navigate backwards in cursor-based pagination');
        }
      } else {
        
        // If going to page 1, reset cursor
        if (page === 1) {
          const result = await getServiceRequestsForProviderPaginated(user!.uid, REQUESTS_PER_PAGE);
          setReceivedRequests(result.requests);
          setReceivedLastVisible(result.lastVisible);
          setReceivedHasMore(result.hasMore);
          setReceivedPage(1);
        } else if (page > receivedPage) {
          const result = await getServiceRequestsForProviderPaginated(user!.uid, REQUESTS_PER_PAGE, receivedLastVisible);
          setReceivedRequests(result.requests);
          setReceivedLastVisible(result.lastVisible);
          setReceivedHasMore(result.hasMore);
          setReceivedPage(page);
        } else {
          console.log('Cannot navigate backwards in cursor-based pagination');
        }
      }
    } catch (error) {
      console.error('Error fetching service requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId: string, status: ServiceRequest['status']) => {
    try {
      // Show confirmation dialog for complete status
      if (status === 'completed') {
        const confirmed = await showConfirmDialog({
          title: 'Mark Request as Completed',
          message: 'Are you sure you want to mark this service request as completed? This action cannot be undone.',
          confirmText: 'Yes, Mark as Completed',
          cancelText: 'Cancel',
          type: 'info'
        });
        
        if (!confirmed) return;
      }
      
      await updateServiceRequestStatus(requestId, status);
      const currentPage = activeTab === "sent" ? sentPage : receivedPage;
      await fetchServiceRequestsPage(currentPage); // Refresh current page
      setSelectedRequest(null);
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update request status");
    }
  };

  // Check if user has already reviewed a service request
  const checkIfReviewed = async (request: ServiceRequest) => {
    if (!user || activeTab !== 'sent') {
      setHasReviewed(false);
      return;
    }

    try {
      const reviewed = await hasUserReviewedServiceRequest(request.id, user.uid);
      setHasReviewed(reviewed);
    } catch (error) {
      console.error("Error checking review status:", error);
      setHasReviewed(false);
    }
  };

  // Handle review submission
  const handleReviewSubmit = async () => {
    if (!selectedRequest || !user || reviewRating === 0 || !reviewComment.trim()) {
      showToast('error', 'Please provide a rating and comment');
      return;
    }

    setReviewSubmitting(true);
    try {
      await createServiceReview(
        selectedRequest.serviceId,
        selectedRequest.id,
        {
          rating: reviewRating,
          comment: reviewComment.trim(),
          reviewerId: user.uid,
          reviewerName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
          serviceTitle: selectedRequest.serviceTitle,
          shopId: selectedRequest.shopId // Will be fetched from service if undefined
        }
      );

      showToast('success', 'Review submitted successfully!');
      setShowReviewModal(false);
      setReviewRating(0);
      setReviewComment('');
      setHasReviewed(true);
    } catch (error) {
      console.error("Error submitting review:", error);
      showToast('error', 'Failed to submit review. Please try again.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Reset review state when modal closes
  const handleCloseReviewModal = () => {
    setShowReviewModal(false);
    setReviewRating(0);
    setReviewComment('');
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: ServiceRequest['status']) => {
    switch (status) {
      case 'pending': return 'text-orange-600 bg-orange-100';
      case 'viewed': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const downloadFile = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    fetchServiceRequestsPage(page);
  };

  // Get current pagination data
  const currentPage = activeTab === "sent" ? sentPage : receivedPage;
  const currentHasMore = activeTab === "sent" ? sentHasMore : receivedHasMore;
  const currentRequests = activeTab === "sent" ? sentRequests : receivedRequests;
  
  // Simple pagination: show next page button only if there are more results
  const totalPages = currentHasMore ? currentPage + 1 : currentPage;
  const currentRequestsCount = currentRequests.length;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#72b01d]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Service Requests</h2>
      </div>

      {/* Sub-tabs */}
      <div className={`border-b border-gray-200 ${isMobile ? 'mb-6' : 'mb-8'}`}>
        <nav className={`flex ${isMobile ? 'space-x-4' : 'space-x-8'}`}>
          {SERVICE_REQUEST_SUBTABS.map(subTab => (
            <button
              key={subTab.key}
              className={`${isMobile ? 'py-3 px-1' : 'py-4 px-1'} border-b-2 font-medium ${isMobile ? 'text-sm' : 'text-sm'} transition-colors ${
                activeTab === subTab.key
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab(subTab.key as "sent" | "received")}
            >
              {subTab.label}
            </button>
          ))}
        </nav>
      </div>

      {currentRequestsCount === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <FiFileText className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {activeTab === "sent" ? "No Sent Requests Yet" : "No Received Requests Yet"}
          </h3>
          <p className="text-gray-500">
            {activeTab === "sent" 
              ? "When you send service requests, they'll appear here."
              : "When customers send you service requests, they'll appear here."
            }
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            {currentRequests.map((request: ServiceRequest) => (
              <div
                key={request.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => {
                  setSelectedRequest(request);
                  checkIfReviewed(request);
                }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {request.serviceTitle}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Package: {request.packageName} • LKR {request.packagePrice.toLocaleString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {activeTab === "received" ? (
                    <>
                      <div className="flex items-center text-sm text-gray-600">
                        <FiUser className="w-4 h-4 mr-2" />
                        {request.customerName}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <FiMail className="w-4 h-4 mr-2" />
                        {request.customerEmail}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <FiPhone className="w-4 h-4 mr-2" />
                        {request.customerPhone}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center text-sm text-gray-600">
                        <FiUser className="w-4 h-4 mr-2" />
                        Service Provider
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <FiMail className="w-4 h-4 mr-2" />
                        Status: {request.status}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <FiClock className="w-4 h-4 mr-2" />
                        Sent: {formatDate(request.createdAt)}
                      </div>
                    </>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center text-sm text-gray-500">
                    <FiClock className="w-4 h-4 mr-2" />
                    {activeTab === "sent" ? `Status: ${request.status}` : formatDate(request.createdAt)}
                  </div>
                  {request.attachedFileName && (
                    <div className="flex items-center text-sm text-blue-600">
                      <FiFileText className="w-4 h-4 mr-1" />
                      File attached
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={currentRequestsCount}
                startIndex={currentRequestsCount > 0 ? (currentPage - 1) * REQUESTS_PER_PAGE + 1 : 0}
                endIndex={currentRequestsCount > 0 ? (currentPage - 1) * REQUESTS_PER_PAGE + currentRequestsCount : 0}
                showInfo={true}
                showJumpTo={totalPages > 10}
              />
            </div>
          )}

          {/* Request Details Modal */}
          {selectedRequest && (
            <div 
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
            >
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200" style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-xl font-bold text-gray-900">
                      {activeTab === "sent" ? "Sent Request Details" : "Received Request Details"}
                    </h3>
                    <button
                      onClick={() => setSelectedRequest(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <FiX className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Service Info */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        {selectedRequest.serviceTitle}
                      </h4>
                      <p className="text-gray-600">
                        Package: {selectedRequest.packageName} • LKR {selectedRequest.packagePrice.toLocaleString()}
                      </p>
                    </div>

                    {/* Customer Info - Only show for received requests */}
                    {activeTab === "received" && (
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">Customer Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center text-gray-600">
                            <FiUser className="w-5 h-5 mr-3" />
                            <div>
                              <p className="font-medium">Name</p>
                              <p>{selectedRequest.customerName}</p>
                            </div>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <FiMail className="w-5 h-5 mr-3" />
                            <div>
                              <p className="font-medium">Email</p>
                              <p>{selectedRequest.customerEmail}</p>
                            </div>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <FiPhone className="w-5 h-5 mr-3" />
                            <div>
                              <p className="font-medium">Phone</p>
                              <p>{selectedRequest.customerPhone}</p>
                            </div>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <FiClock className="w-5 h-5 mr-3" />
                            <div>
                              <p className="font-medium">Requested On</p>
                              <p>{formatDate(selectedRequest.createdAt)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Request Status and Date - Show for sent requests */}
                    {activeTab === "sent" && (
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">Request Status</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center text-gray-600">
                            <FiClock className="w-5 h-5 mr-3" />
                            <div>
                              <p className="font-medium">Status</p>
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedRequest.status)}`}>
                                {selectedRequest.status}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <FiClock className="w-5 h-5 mr-3" />
                            <div>
                              <p className="font-medium">Sent On</p>
                              <p>{formatDate(selectedRequest.createdAt)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Customer Requirements */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">
                        {activeTab === "sent" ? "Your Requirements" : "Customer Requirements"}
                      </h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {selectedRequest.customerInfo}
                        </p>
                      </div>
                    </div>

                    {/* Attached File */}
                    {selectedRequest.attachedFileName && selectedRequest.attachedFileUrl && (
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">Attached File</h4>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <FiFileText className="w-5 h-5 mr-3 text-gray-500" />
                            <span className="text-gray-700">{selectedRequest.attachedFileName}</span>
                          </div>
                          <button
                            onClick={() => downloadFile(selectedRequest.attachedFileUrl!, selectedRequest.attachedFileName!)}
                            className="flex items-center text-blue-600 hover:text-blue-800"
                          >
                            <FiDownload className="w-4 h-4 mr-1" />
                            Download
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Contact Instructions */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="text-lg font-semibold text-blue-900 mb-2">Next Steps</h4>
                      {activeTab === "received" ? (
                        <p className="text-blue-800">
                          Contact the customer directly using the phone number or email above to discuss their requirements 
                          and provide your service. You can mark this request as completed once you've handled it.
                        </p>
                      ) : (
                        selectedRequest.status === 'completed' ? (
                          <p className="text-blue-800">
                            This service request has been completed. If you haven't already, you can write a review 
                            to share your experience and help other customers.
                          </p>
                        ) : (
                          <p className="text-blue-800">
                            Your request has been sent to the service provider. They will contact you directly using the 
                            contact information you provided to discuss your requirements and provide a quote for their service.
                          </p>
                        )
                      )}
                    </div>

                    {/* Status Update - Only show for received requests */}
                    {activeTab === "received" && (
                      <div className="flex justify-between items-center pt-4 border-t">
                        <div className="flex items-center">
                          <span className="text-gray-600 mr-2">Status:</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedRequest.status)}`}>
                            {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          {selectedRequest.status === 'pending' && (
                            <button
                              onClick={() => handleStatusUpdate(selectedRequest.id, 'viewed')}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                              Mark as Viewed
                            </button>
                          )}
                          {selectedRequest.status !== 'completed' && (
                            <button
                              onClick={() => handleStatusUpdate(selectedRequest.id, 'completed')}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                              Mark as Completed
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Review Section - Show for all sent requests */}
                    {activeTab === "sent" && (
                      <div className="pt-4 border-t">
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">Service Review</h4>
                        {hasReviewed ? (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center text-green-700">
                              <FiStar className="w-5 h-5 mr-2" />
                              <span className="font-medium">You have already reviewed this service</span>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowReviewModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-[#72b01d] text-white rounded-lg hover:bg-[#3f7d20] transition-colors"
                          >
                            <FiStar className="w-4 h-4" />
                            Write a Review
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Review Modal */}
      {showReviewModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-200">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-bold text-gray-900">Write a Review</h3>
                <button
                  onClick={handleCloseReviewModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">{selectedRequest.serviceTitle}</h4>
                  <p className="text-sm text-gray-600">Package: {selectedRequest.packageName}</p>
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="p-1 transition-colors"
                      >
                        <FiStar
                          className={`w-6 h-6 ${
                            star <= reviewRating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Review</label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your experience with this service..."
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#72b01d] focus:border-[#72b01d] resize-none"
                    rows={4}
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleCloseReviewModal}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReviewSubmit}
                    disabled={reviewSubmitting || reviewRating === 0 || !reviewComment.trim()}
                    className="flex-1 px-4 py-2 bg-[#72b01d] text-white rounded-lg hover:bg-[#3f7d20] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        type={confirmDialog.type}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
}
