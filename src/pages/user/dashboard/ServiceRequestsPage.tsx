import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { getServiceRequestsForProvider, getServiceRequestsForCustomer, updateServiceRequestStatus } from "../../../utils/serviceRequests";
import type { ServiceRequest } from "../../../types/serviceRequest";
import { FiClock, FiUser, FiMail, FiFileText, FiDownload, FiPhone, FiX } from "react-icons/fi";
import { useResponsive } from "../../../hooks/useResponsive";
import { useConfirmDialog } from "../../../hooks/useConfirmDialog";
import { ConfirmDialog } from "../../../components/UI";

const SERVICE_REQUEST_SUBTABS = [
  { key: "sent", label: "Sent Requests" },
  { key: "received", label: "Received Requests" },
];

export default function ServiceRequestsPage() {
  const { user } = useAuth();
  const { isMobile } = useResponsive();
  const { isOpen, confirmDialog, showConfirmDialog, handleConfirm, handleCancel } = useConfirmDialog();
  const [sentRequests, setSentRequests] = useState<ServiceRequest[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [activeTab, setActiveTab] = useState<"sent" | "received">("sent");

  useEffect(() => {
    if (user) {
      fetchServiceRequests();
    }
  }, [user]);

  const fetchServiceRequests = async () => {
    if (!user) return;
    
    try {
      // Fetch both sent and received requests
      const [sentData, receivedData] = await Promise.all([
        getServiceRequestsForCustomer(user.uid),
        getServiceRequestsForProvider(user.uid)
      ]);
      
      setSentRequests(sentData);
      setReceivedRequests(receivedData);
    } catch (error) {
      console.error("Error fetching service requests:", error);
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
      await fetchServiceRequests(); // Refresh both lists
      setSelectedRequest(null);
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update request status");
    }
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

  // Get current requests based on active tab
  const currentRequests = activeTab === "sent" ? sentRequests : receivedRequests;
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
        <div className="text-sm text-gray-500">
          {currentRequestsCount} request{currentRequestsCount !== 1 ? 's' : ''}
        </div>
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
                onClick={() => setSelectedRequest(request)}
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
                      <p className="text-blue-800">
                        Contact the customer directly using the phone number or email above to discuss their requirements 
                        and provide your service. You can mark this request as completed once you've handled it.
                      </p>
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
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
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
