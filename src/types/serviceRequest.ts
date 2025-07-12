export interface ServiceRequest {
  id: string;
  serviceId: string;
  serviceTitle: string;
  packageId: string;
  packageName: string;
  packagePrice: number;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  providerId: string;
  customerInfo: string;
  attachedFileName?: string;
  attachedFileUrl?: string;
  status: 'pending' | 'viewed' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceRequestFormData {
  serviceId: string;
  packageId: string;
  customerInfo: string;
  customerPhone: string;
  attachedFile?: File;
}

export interface ServiceRequestFormData {
  serviceId: string;
  packageId: string;
  customerInfo: string;
  attachedFile?: File;
}
