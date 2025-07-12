import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  getDocs, 
  getCountFromServer,
  QueryDocumentSnapshot,
  Query,
  QueryConstraint
} from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import { db } from '../utils/firebase';
import type { Service } from '../types/service';
import { ServiceCategory } from '../utils/serviceCategories';

export interface ServiceFilters {
  category?: ServiceCategory | 'all';
  subcategory?: string;
  deliveryType?: 'all' | 'onsite' | 'online';
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sortBy?: 'newest' | 'oldest' | 'price-asc' | 'price-desc';
}

export interface PaginationInfo {
  currentPage: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface UseServicesResult {
  services: Service[];
  loading: boolean;
  error: string | null;
  pagination: PaginationInfo;
  loadMore: () => Promise<void>;
  loadPage: (page: number) => Promise<void>;
  refresh: () => Promise<void>;
  hasMore: boolean;
}

const PAGE_SIZE = 16;

export const useServices = (filters: ServiceFilters = {}): UseServicesResult => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastDocMap, setLastDocMap] = useState<Map<number, QueryDocumentSnapshot<DocumentData>>>(new Map());
  const [totalCount, setTotalCount] = useState(0);
  const [filteredCount, setFilteredCount] = useState(0); // For search results

  const buildQuery = useCallback((startAfterDoc?: QueryDocumentSnapshot<DocumentData> | null, includeLimit: boolean = true): Query<DocumentData> => {
    const constraints: QueryConstraint[] = [
      where("isActive", "==", true),
      where("isPaused", "==", false)
    ];

    // Category filter
    if (filters.category && filters.category !== 'all') {
      constraints.push(where("category", "==", filters.category));
    }

    // Subcategory filter
    if (filters.subcategory) {
      constraints.push(where("subcategory", "==", filters.subcategory));
    }

    // Delivery type filter
    if (filters.deliveryType && filters.deliveryType !== 'all') {
      constraints.push(where("deliveryType", "==", filters.deliveryType));
    }

    // Location filter (using array-contains for serviceArea)
    if (filters.location && filters.location !== 'all') {
      constraints.push(where("serviceArea", "array-contains", filters.location));
    }

    // Sorting
    if (filters.sortBy === 'newest' || !filters.sortBy) {
      constraints.push(orderBy("createdAt", "desc"));
    } else if (filters.sortBy === 'oldest') {
      constraints.push(orderBy("createdAt", "asc"));
    } else if (filters.sortBy === 'price-asc' || filters.sortBy === 'price-desc') {
      // For price sorting, we'll sort by createdAt first and then sort client-side
      // because minPrice is calculated client-side and doesn't exist in Firestore
      constraints.push(orderBy("createdAt", "desc"));
    }

    // Add pagination
    if (startAfterDoc) {
      constraints.push(startAfter(startAfterDoc));
    }

    if (includeLimit) {
      constraints.push(limit(PAGE_SIZE));
    }

    return query(collection(db, "services"), ...constraints);
  }, [filters]);

  const buildCountQuery = useCallback((): Query<DocumentData> => {
    const constraints: QueryConstraint[] = [
      where("isActive", "==", true),
      where("isPaused", "==", false)
    ];

    // Category filter
    if (filters.category && filters.category !== 'all') {
      constraints.push(where("category", "==", filters.category));
    }

    // Subcategory filter
    if (filters.subcategory) {
      constraints.push(where("subcategory", "==", filters.subcategory));
    }

    // Delivery type filter
    if (filters.deliveryType && filters.deliveryType !== 'all') {
      constraints.push(where("deliveryType", "==", filters.deliveryType));
    }

    // Location filter (using array-contains for serviceArea)
    if (filters.location && filters.location !== 'all') {
      constraints.push(where("serviceArea", "array-contains", filters.location));
    }

    // Sorting for count (needed for Firestore consistency)
    if (filters.sortBy === 'newest' || !filters.sortBy) {
      constraints.push(orderBy("createdAt", "desc"));
    } else if (filters.sortBy === 'oldest') {
      constraints.push(orderBy("createdAt", "asc"));
    } else if (filters.sortBy === 'price-asc' || filters.sortBy === 'price-desc') {
      // For price sorting, we'll sort by createdAt first and then sort client-side
      constraints.push(orderBy("createdAt", "desc"));
    }

    return query(collection(db, "services"), ...constraints);
  }, [filters]);

  const applyClientSideFilters = useCallback((servicesList: Service[]): Service[] => {
    let filtered = servicesList;

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(service =>
        service.title.toLowerCase().includes(searchTerm) ||
        service.description.toLowerCase().includes(searchTerm) ||
        service.category.toLowerCase().includes(searchTerm) ||
        (service.subcategory && service.subcategory.toLowerCase().includes(searchTerm))
      );
    }

    // Price range filter (client-side because we need to check package prices)
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      filtered = filtered.filter(service => {
        if (!service.packages || service.packages.length === 0) return true;
        
        const minServicePrice = Math.min(...service.packages.map(pkg => pkg.price));
        const maxServicePrice = Math.max(...service.packages.map(pkg => pkg.price));
        
        const minFilter = filters.minPrice !== undefined ? filters.minPrice : 0;
        const maxFilter = filters.maxPrice !== undefined ? filters.maxPrice : Infinity;
        
        return minServicePrice >= minFilter && maxServicePrice <= maxFilter;
      });
    }

    return filtered;
  }, [filters.search, filters.minPrice, filters.maxPrice]);

  const applySorting = useCallback((servicesList: Service[]): Service[] => {
    if (filters.sortBy === 'price-asc') {
      return [...servicesList].sort((a, b) => (a.minPrice || 0) - (b.minPrice || 0));
    } else if (filters.sortBy === 'price-desc') {
      return [...servicesList].sort((a, b) => (b.minPrice || 0) - (a.minPrice || 0));
    }
    // For other sorting (newest, oldest), it's already handled by Firestore
    return servicesList;
  }, [filters.sortBy]);

  const fetchServices = useCallback(async (page: number = 1, append: boolean = false) => {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      // Get the last document for pagination
      const startAfterDoc = page > 1 ? lastDocMap.get(page - 1) : null;
      
      // For search queries, we need to fetch more data and filter client-side
      if (filters.search) {
        
        // If this is the first page, fetch all results to get accurate count
        if (page === 1) {
          // Fetch all matching documents to get accurate filtered count
          const allQuery = buildQuery(null, false); // No limit for counting
          const allSnapshot = await getDocs(allQuery);
          const allServices = allSnapshot.docs.map(doc => ({
            id: doc.id,
            ...(doc.data() as Omit<Service, 'id'>)
          })) as Service[];
          
          const allServicesWithPrice = allServices.map(service => ({
            ...service,
            minPrice: service.packages && service.packages.length > 0 
              ? Math.min(...service.packages.map(pkg => pkg.price))
              : 0
          }));
          
          const allFilteredServices = applyClientSideFilters(allServicesWithPrice);
          const sortedServices = applySorting(allFilteredServices);
          setFilteredCount(sortedServices.length);
          
          // Get the page slice
          const startIndex = (page - 1) * PAGE_SIZE;
          const endIndex = startIndex + PAGE_SIZE;
          const pageServices = sortedServices.slice(startIndex, endIndex);
          
          setServices(pageServices);
          setHasMore(endIndex < sortedServices.length);
        } else {
          // For subsequent pages, we need to implement client-side pagination
          // This is a simplified approach - ideally we'd cache the full results
          const allQuery = buildQuery(null, false); // No limit for pagination
          const allSnapshot = await getDocs(allQuery);
          const allServices = allSnapshot.docs.map(doc => ({
            id: doc.id,
            ...(doc.data() as Omit<Service, 'id'>)
          })) as Service[];
          
          const allServicesWithPrice = allServices.map(service => ({
            ...service,
            minPrice: service.packages && service.packages.length > 0 
              ? Math.min(...service.packages.map(pkg => pkg.price))
              : 0
          }));
          
          const allFilteredServices = applyClientSideFilters(allServicesWithPrice);
          const sortedServices = applySorting(allFilteredServices);
          setFilteredCount(sortedServices.length);
          
          const startIndex = (page - 1) * PAGE_SIZE;
          const endIndex = startIndex + PAGE_SIZE;
          const pageServices = sortedServices.slice(startIndex, endIndex);
          
          setServices(pageServices);
          setHasMore(endIndex < sortedServices.length);
        }
      } else {
        // Normal pagination for non-search queries
        const servicesQuery = buildQuery(startAfterDoc || null);
        const snapshot = await getDocs(servicesQuery);

        let servicesList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as Omit<Service, 'id'>)
        })) as Service[];

        // Calculate minPrice for each service for server-side price sorting
        servicesList = servicesList.map(service => ({
          ...service,
          minPrice: service.packages && service.packages.length > 0 
            ? Math.min(...service.packages.map(pkg => pkg.price))
            : 0
        }));

        // Apply client-side filters
        const filteredServices = applyClientSideFilters(servicesList);
        
        // Apply client-side sorting
        const sortedServices = applySorting(filteredServices);
        
        const countQuery = buildCountQuery();
        const countSnapshot = await getCountFromServer(countQuery);
        setTotalCount(countSnapshot.data().count || 0);
        setFilteredCount(0); // Reset for non-search queries
        
        if (append) {
          setServices(prev => [...prev, ...sortedServices]);
        } else {
          setServices(sortedServices);
        }
        
        setHasMore(snapshot.docs.length === PAGE_SIZE);
        
        // Store the last document for the next page
        const lastDocument = snapshot.docs[snapshot.docs.length - 1];
        if (lastDocument) {
          setLastDocMap(prev => {
            const newMap = new Map(prev);
            newMap.set(page, lastDocument);
            return newMap;
          });
        }
      }

      setCurrentPage(page);

    } catch (err) {
      console.error('Error fetching services:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch services');
    } finally {
      setLoading(false);
    }
  }, [loading, buildQuery, buildCountQuery, applyClientSideFilters, applySorting, lastDocMap, filters.search]);

  const loadMore = useCallback(async () => {
    if (hasMore && !loading) {
      await fetchServices(currentPage + 1, true);
    }
  }, [hasMore, loading, currentPage, fetchServices]);

  const loadPage = useCallback(async (page: number) => {
    if (page !== currentPage) {
      await fetchServices(page, false);
    }
  }, [currentPage, fetchServices]);

  const refresh = useCallback(async () => {
    setServices([]);
    setLastDocMap(new Map());
    setCurrentPage(1);
    setHasMore(true);
    setTotalCount(0);
    setFilteredCount(0);
    await fetchServices(1, false);
  }, [fetchServices]);

  // Load initial data when filters change
  useEffect(() => {
    refresh();
  }, [
    filters.category,
    filters.subcategory,
    filters.deliveryType,
    filters.location,
    filters.sortBy,
    filters.search,
    filters.minPrice,
    filters.maxPrice
  ]);

  const pagination: PaginationInfo = {
    currentPage,
    totalItems: filters.search ? filteredCount : totalCount,
    totalPages: Math.max(1, Math.ceil((filters.search ? filteredCount : totalCount) / PAGE_SIZE)),
    hasNextPage: hasMore,
    hasPreviousPage: currentPage > 1
  };

  return {
    services,
    loading,
    error,
    pagination,
    loadMore,
    loadPage,
    refresh,
    hasMore
  };
};
