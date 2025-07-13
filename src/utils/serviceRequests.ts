import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  doc, 
  updateDoc,
  getDoc,
  serverTimestamp,
  limit,
  startAfter,
  DocumentSnapshot
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "./firebase";
import { createNotification } from "./notifications";
import { sendServiceRequestNotificationEmail } from "./emailService";
import type { ServiceRequest, ServiceRequestFormData } from "../types/serviceRequest";

export const submitServiceRequest = async (
  formData: ServiceRequestFormData,
  user: any,
  service: any,
  selectedPackage: any
): Promise<string> => {
  try {
    // Validate required fields
    if (!service.owner) {
      console.error("Service data:", service);
      throw new Error("Service owner information is missing");
    }
    if (!service.title) {
      console.error("Service data:", service);
      throw new Error("Service title is missing");
    }
    if (!selectedPackage.name || !selectedPackage.price) {
      console.error("Package data:", selectedPackage);
      throw new Error("Package information is incomplete");
    }
    if (!user.uid || !user.email) {
      console.error("User data:", user);
      throw new Error("User information is incomplete");
    }

    let attachedFileUrl = "";
    let attachedFileName = "";

    // Upload file if provided
    if (formData.attachedFile) {
      const fileRef = ref(storage, `service-requests/${Date.now()}_${formData.attachedFile.name}`);
      const snapshot = await uploadBytes(fileRef, formData.attachedFile);
      attachedFileUrl = await getDownloadURL(snapshot.ref);
      attachedFileName = formData.attachedFile.name;
    }

    // Create service request document
    const serviceRequestData = {
      serviceId: formData.serviceId,
      serviceTitle: service.title,
      shopId: service.shopId,
      packageId: formData.packageId,
      packageName: selectedPackage.name,
      packagePrice: selectedPackage.price,
      customerId: user.uid,
      customerName: user.displayName || user.email,
      customerEmail: user.email,
      customerPhone: formData.customerPhone,
      providerId: service.owner,
      customerInfo: formData.customerInfo,
      attachedFileName,
      attachedFileUrl,
      status: "pending" as const,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "serviceRequests"), serviceRequestData);

    // Send notification to service provider
    await createNotification(
      service.owner,
      "service_request",
      "New Service Request",
      `You have received a new service request for "${service.title}"`,
      {
        data: { requestId: docRef.id, serviceId: formData.serviceId }
      }
    );

    // Send email to service provider
    const providerDoc = await getDoc(doc(db, "users", service.owner));
    if (providerDoc.exists()) {
      const providerData = providerDoc.data();
      if (providerData.email) {
        try {
          await sendServiceRequestNotificationEmail(
            providerData.email,
            service.title,
            selectedPackage.name,
            selectedPackage.price,
            user.displayName || user.email,
            user.email,
            formData.customerInfo,
            attachedFileName
          );
        } catch (error) {
          console.error("Failed to send service request notification email:", error);
          // Don't fail the entire request if email fails
        }
      }
    }

    return docRef.id;
  } catch (error) {
    console.error("Error submitting service request:", error);
    throw new Error("Failed to submit service request");
  }
};

export const getServiceRequestsForProvider = async (providerId: string): Promise<ServiceRequest[]> => {
  try {
    const q = query(
      collection(db, "serviceRequests"),
      where("providerId", "==", providerId),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    } as ServiceRequest));
  } catch (error) {
    console.error("Error fetching service requests:", error);
    throw new Error("Failed to fetch service requests");
  }
};

export const getServiceRequestsForCustomer = async (customerId: string): Promise<ServiceRequest[]> => {
  try {
    const q = query(
      collection(db, "serviceRequests"),
      where("customerId", "==", customerId),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    } as ServiceRequest));
  } catch (error) {
    console.error("Error fetching service requests:", error);
    throw new Error("Failed to fetch service requests");
  }
};

export const updateServiceRequestStatus = async (
  requestId: string,
  status: ServiceRequest['status']
): Promise<void> => {
  try {
    const updateData = {
      status,
      updatedAt: serverTimestamp()
    };

    await updateDoc(doc(db, "serviceRequests", requestId), updateData);

    // Send notification to customer about status update
    const requestDoc = await getDoc(doc(db, "serviceRequests", requestId));
    if (requestDoc.exists()) {
      const requestData = requestDoc.data();
      await createNotification(
        requestData.customerId,
        "service_request_update",
        "Service Request Update",
        `Your service request for "${requestData.serviceTitle}" has been ${status}`,
        {
          data: { requestId, serviceId: requestData.serviceId }
        }
      );
    }
  } catch (error) {
    console.error("Error updating service request:", error);
    throw new Error("Failed to update service request");
  }
};

// Paginated service request functions
export const getServiceRequestsForProviderPaginated = async (
  providerId: string,
  pageSize: number = 5,
  lastVisible?: DocumentSnapshot
): Promise<{ requests: ServiceRequest[]; hasMore: boolean; lastVisible?: DocumentSnapshot }> => {
  try {
    // Fetch one extra document to determine if there are more pages
    const queryLimit = pageSize + 1;
    
    let q = query(
      collection(db, "serviceRequests"),
      where("providerId", "==", providerId),
      orderBy("createdAt", "desc"),
      limit(queryLimit)
    );

    if (lastVisible) {
      q = query(
        collection(db, "serviceRequests"),
        where("providerId", "==", providerId),
        orderBy("createdAt", "desc"),
        startAfter(lastVisible),
        limit(queryLimit)
      );
    }
    
    const querySnapshot = await getDocs(q);
    
    // Take only the requested number of documents
    const docs = querySnapshot.docs.slice(0, pageSize);
    const requests = docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    } as ServiceRequest));

    // hasMore is true if we got more documents than requested
    const hasMore = querySnapshot.docs.length > pageSize;
    const newLastVisible = docs[docs.length - 1];

    return {
      requests,
      hasMore,
      lastVisible: newLastVisible
    };
  } catch (error) {
    console.error("Error fetching paginated service requests for provider:", error);
    throw new Error("Failed to fetch service requests");
  }
};

export const getServiceRequestsForCustomerPaginated = async (
  customerId: string,
  pageSize: number = 5,
  lastVisible?: DocumentSnapshot
): Promise<{ requests: ServiceRequest[]; hasMore: boolean; lastVisible?: DocumentSnapshot }> => {
  try {
    // Fetch one extra document to determine if there are more pages
    const queryLimit = pageSize + 1;
    
    let q = query(
      collection(db, "serviceRequests"),
      where("customerId", "==", customerId),
      orderBy("createdAt", "desc"),
      limit(queryLimit)
    );

    if (lastVisible) {
      q = query(
        collection(db, "serviceRequests"),
        where("customerId", "==", customerId),
        orderBy("createdAt", "desc"),
        startAfter(lastVisible),
        limit(queryLimit)
      );
    }
    
    const querySnapshot = await getDocs(q);
    
    // Take only the requested number of documents
    const docs = querySnapshot.docs.slice(0, pageSize);
    const requests = docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    } as ServiceRequest));

    // hasMore is true if we got more documents than requested
    const hasMore = querySnapshot.docs.length > pageSize;
    const newLastVisible = docs[docs.length - 1];

    return {
      requests,
      hasMore,
      lastVisible: newLastVisible
    };
  } catch (error) {
    console.error("Error fetching paginated service requests for customer:", error);
    throw new Error("Failed to fetch service requests");
  }
};
