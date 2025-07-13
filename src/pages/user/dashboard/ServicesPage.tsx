import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { db, storage } from "../../../utils/firebase";
import { collection, query, where, getDocs, doc, deleteDoc, orderBy } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { Link } from "react-router-dom";
import { FiPlus, FiUsers } from "react-icons/fi";
import { useConfirmDialog } from "../../../hooks/useConfirmDialog";
import { ConfirmDialog } from "../../../components/UI";

interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  deliveryType: string;
  serviceArea: string[];
  packages: Array<{
    id: string;
    name: string;
    price: number;
    isPopular?: boolean;
  }>;
  images: string[];
  isActive: boolean;
  isPaused: boolean;
  viewCount: number;
  bookingCount: number;
  createdAt: any;
  owner: string;
  shopId: string;
}

export default function ServicesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const { isOpen, confirmDialog, showConfirmDialog, handleConfirm, handleCancel } = useConfirmDialog();

  // Fetch user's services
  const fetchServices = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const servicesQuery = query(
        collection(db, "services"),
        where("owner", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      const servicesSnapshot = await getDocs(servicesQuery);
      const servicesList = servicesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Service[];

      setServices(servicesList);
    } catch (error) {
      console.error("Error fetching services:", error);
      showToast("error", "Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  // Delete service function
  const deleteService = async (serviceId: string, serviceImages: string[]) => {
    const confirmed = await showConfirmDialog({
      title: "Delete Service",
      message: "Are you sure you want to delete this service? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      type: "danger"
    });

    if (!confirmed) return;

    try {
      // Delete images from Firebase Storage
      if (serviceImages && serviceImages.length > 0) {
        const deleteImagePromises = serviceImages.map(async (imageUrl) => {
          try {
            const imageRef = ref(storage, imageUrl);
            await deleteObject(imageRef);
          } catch (error) {
            console.warn("Error deleting image:", error);
          }
        });
        await Promise.all(deleteImagePromises);
      }

      // Delete service document
      await deleteDoc(doc(db, "services", serviceId));

      // Update local state
      setServices(prev => prev.filter(service => service.id !== serviceId));
      showToast("success", "Service deleted successfully");
    } catch (error) {
      console.error("Error deleting service:", error);
      showToast("error", "Failed to delete service");
    }
  };

  // Get service status
  const getServiceStatus = (service: Service) => {
    if (!service.isActive) return { text: "Inactive", color: "text-gray-500 bg-gray-100" };
    if (service.isPaused) return { text: "Paused", color: "text-yellow-700 bg-yellow-100" };
    return { text: "Active", color: "text-green-700 bg-green-100" };
  };

  // Get lowest package price
  const getLowestPrice = (packages: Service['packages']) => {
    if (!packages || packages.length === 0) return 0;
    return Math.min(...packages.map(pkg => pkg.price));
  };

  useEffect(() => {
    fetchServices();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-[#72b01d] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <ConfirmDialog
        isOpen={isOpen}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        {...confirmDialog}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Services</h2>
          <p className="text-gray-600">Manage your service offerings</p>
        </div>
        <Link
          to="/add-service"
          className="mt-4 sm:mt-0 inline-flex items-center px-6 py-3 bg-[#72b01d] hover:bg-[#3f7d20] text-white font-semibold rounded-xl transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <FiPlus className="w-5 h-5 mr-2" />
          Add New Service
        </Link>
      </div>

      {/* Services List */}
      {services.length === 0 ? (
        <div className="text-center py-16">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <FiUsers className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No services yet</h3>
          <p className="text-gray-600 mb-6 max-w-sm mx-auto">
            Create your first service to start offering your professional skills to customers.
          </p>
          <Link
            to="/add-service"
            className="inline-flex items-center px-6 py-3 bg-[#72b01d] hover:bg-[#3f7d20] text-white font-semibold rounded-xl transition-colors"
          >
            <FiPlus className="w-5 h-5 mr-2" />
            Get Started
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {services.map((service) => {
            const status = getServiceStatus(service);
            const lowestPrice = getLowestPrice(service.packages);
            
            return (
              <div
                key={service.id}
                className="border rounded-xl transition p-3 sm:p-4 bg-white hover:bg-[#72b01d]/5 hover:border-[#72b01d]"
                style={{ borderColor: 'rgba(114, 176, 29, 0.3)' }}
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  {/* Service Image */}
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded border overflow-hidden flex-shrink-0" style={{ borderColor: 'rgba(114, 176, 29, 0.3)' }}>
                    {service.images && service.images.length > 0 ? (
                      <img
                        src={service.images[0]}
                        alt={service.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <FiUsers className="w-4 h-4 sm:w-6 sm:h-6 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Service Info */}
                  <div className="flex-1 min-w-0">
                    <Link 
                      to={`/service/${service.id}`}
                      className="font-bold text-base sm:text-lg text-gray-900 hover:text-[#72b01d] transition-colors truncate block"
                    >
                      {service.title}
                    </Link>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                        {status.text}
                      </span>
                      <span className="text-xs text-gray-500 capitalize">
                        {service.deliveryType}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 truncate mb-1">
                      {service.description}
                    </p>
                    <p className="font-bold text-sm sm:text-base text-[#3f7d20]">
                      From LKR {lowestPrice.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-3 sm:mt-4 flex justify-end gap-2">
                  <Link
                    to={`/edit-service/${service.id}`}
                    className="px-3 py-1 sm:px-4 sm:py-2 rounded font-semibold transition border text-xs sm:text-sm bg-[#72b01d] text-white border-[#72b01d] hover:bg-[#3f7d20]"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => deleteService(service.id, service.images)}
                    className="px-3 py-1 sm:px-4 sm:py-2 rounded font-semibold transition border text-xs sm:text-sm bg-white text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                    style={{ borderColor: 'rgba(114, 176, 29, 0.3)' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
