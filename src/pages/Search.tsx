import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { collection, query, where, orderBy, type QueryDocumentSnapshot, type DocumentData } from "firebase/firestore";
import { db } from "../utils/firebase";
import { categories } from "../utils/categories";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button, Input, Pagination, BackToTop } from "../components/UI";
import ResponsiveHeader from "../components/UI/ResponsiveHeader";
import ResponsiveListingTile from "../components/UI/ResponsiveListingTile";
import WithReviewStats from "../components/HOC/WithReviewStats";
import Footer from "../components/UI/Footer";
import { useResponsive } from "../hooks/useResponsive";
import { SEOHead } from "../components/SEO/SEOHead";
import { getUserIP } from "../utils/ipUtils";
import { getCanonicalUrl, generateKeywords } from "../utils/seo";
import { paginateQuery } from "../utils/paginateFirestore";

interface Listing {
  id: string;
  name?: string;
  price?: number;
  description?: string;
  category?: string;
  subcategory?: string;
  deliveryType?: "free" | "paid";
  createdAt?: { seconds: number };
  [key: string]: any;
}

const Search: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cacheRef = useRef<Map<string, Listing[]>>(new Map());
  const { isMobile } = useResponsive();

  // For sidebar filter
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false); // Mobile filter visibility

  // Listings & user IP
  const [items, setItems] = useState<Listing[]>([]);
  const [ip, setIp] = useState<string | null>(null);

  // Loading states
  const [searching, setSearching] = useState(false);

  // Filters/search state
  const [searchInput, setSearchInput] = useState("");
  const [cat, setCat] = useState("");
  const [sub, setSub] = useState("");
  const [filterMinPrice, setFilterMinPrice] = useState("");
  const [filterMaxPrice, setFilterMaxPrice] = useState("");
  const [filterSort, setFilterSort] = useState("");
  const [filterFreeShipping, setFilterFreeShipping] = useState(false);

  // Applied filters (when user clicks "Apply")
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedMinPrice, setAppliedMinPrice] = useState("");
  const [appliedMaxPrice, setAppliedMaxPrice] = useState("");
  const [appliedSort, setAppliedSort] = useState("");
  const [appliedFreeShipping, setAppliedFreeShipping] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12; // Adjust as needed
  
  // Server-side pagination state
  const [lastDocMap, setLastDocMap] = useState<Map<number, QueryDocumentSnapshot<DocumentData> | null>>(new Map());
  const [maxKnownPage, setMaxKnownPage] = useState(1);

  // On mount or search param change: sync state
  useEffect(() => {
    setCat(searchParams.get("cat") || "");
    setSub(searchParams.get("sub") || "");
    setSearchInput(searchParams.get("q") || "");
    setAppliedSearch(searchParams.get("q") || "");
    setFilterMinPrice(searchParams.get("min") || "");
    setFilterMaxPrice(searchParams.get("max") || "");
    setFilterSort(searchParams.get("sort") || "");
    setFilterFreeShipping(searchParams.get("free") === "1");
    setAppliedMinPrice(searchParams.get("min") || "");
    setAppliedMaxPrice(searchParams.get("max") || "");
    setAppliedSort(searchParams.get("sort") || "");
    setAppliedFreeShipping(searchParams.get("free") === "1");
    setCurrentPage(parseInt(searchParams.get("page") || "1"));
    // Scroll to top when search params change (i.e., when user comes to search page or changes filters/page)
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [searchParams]);

  // Get user's IP on mount
  useEffect(() => {
    const fetchUserIP = async () => {
      const userIp = await getUserIP();
      setIp(userIp);
    };
    fetchUserIP();
  }, []);

  // Build query for server-side pagination
  const buildPaginatedQuery = useCallback(() => {
    const conditions: any[] = [];

    // Add server-side filters where possible
    if (cat) {
      conditions.push(where("category", "==", cat));
    }
    if (sub) {
      conditions.push(where("subcategory", "==", sub));
    }
    if (appliedFreeShipping) {
      conditions.push(where("deliveryType", "==", "free"));
    }

    // Add ordering (must be after where clauses)
    let queryConstraints = [...conditions];
    if (appliedSort === "newest") {
      queryConstraints.push(orderBy("createdAt", "desc"));
    } else if (appliedSort === "price-asc") {
      queryConstraints.push(orderBy("price", "asc"));
    } else if (appliedSort === "price-desc") {
      queryConstraints.push(orderBy("price", "desc"));
    } else {
      // Default ordering for pagination
      queryConstraints.push(orderBy("createdAt", "desc"));
    }

    return query(collection(db, "listings"), ...queryConstraints);
  }, [cat, sub, appliedFreeShipping, appliedSort]);

  // Server-side paginated fetch function
  const fetchPaginatedListings = useCallback(async (page: number = 1) => {
    if (!ip) return;
    
    // Create cache key from current filters and page
    const cacheKey = JSON.stringify({
      cat,
      sub,
      appliedFreeShipping,
      appliedSort,
      appliedSearch,
      appliedMinPrice,
      appliedMaxPrice,
      page,
    });

    // Check cache first
    if (cacheRef.current.has(cacheKey)) {
      const cachedResults = cacheRef.current.get(cacheKey)!;
      setItems(cachedResults);
      setSearching(false);
      return;
    }
    
    try {
      setSearching(true);
      const baseQuery = buildPaginatedQuery();
      
      // Get the last document for the previous page (for pagination)
      const startAfter = page > 1 ? lastDocMap.get(page - 1) : null;
      
      // Use the paginateQuery utility
      const { docs, lastDoc, hasMore } = await paginateQuery(
        baseQuery,
        itemsPerPage,
        startAfter || undefined
      );
      
      let results: Listing[] = docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
        id: doc.id,
        ...doc.data(),
        __client_ip: ip,
      } as Listing));

      // Apply client-side filters that can't be done server-side
      if (appliedSearch) {
        results = results.filter(item => 
          item.name?.toLowerCase().includes(appliedSearch.toLowerCase()) ||
          item.description?.toLowerCase().includes(appliedSearch.toLowerCase())
        );
      }

      if (appliedMinPrice) {
        results = results.filter(item => Number(item.price) >= Number(appliedMinPrice));
      }

      if (appliedMaxPrice) {
        results = results.filter(item => Number(item.price) <= Number(appliedMaxPrice));
      }

      // Update pagination state
      setLastDocMap(prev => {
        const newMap = new Map(prev);
        newMap.set(page, lastDoc);
        return newMap;
      });
      
      // Update max known page based on whether there are more results
      if (hasMore) {
        setMaxKnownPage(prev => Math.max(prev, page + 1));
      } else {
        setMaxKnownPage(page); // This is the last page
      }

      // Cache the results (limit cache size to prevent memory issues)
      if (cacheRef.current.size >= 10) {
        const firstKey = cacheRef.current.keys().next().value;
        if (firstKey) {
          cacheRef.current.delete(firstKey);
        }
      }
      cacheRef.current.set(cacheKey, results);

      setItems(results);
    } catch (error) {
      console.error("Error fetching listings:", error);
      setItems([]);
      // Don't update pagination state on error to preserve existing state
    } finally {
      setSearching(false);
    }
  }, [ip, buildPaginatedQuery, appliedSearch, appliedMinPrice, appliedMaxPrice, cat, sub, appliedFreeShipping, appliedSort, lastDocMap, itemsPerPage]);

  // Fetch listings when dependencies change
  useEffect(() => {
    if (ip !== null) {
      fetchPaginatedListings(currentPage);
    }
  }, [ip, cat, sub, appliedFreeShipping, appliedSort, appliedSearch, appliedMinPrice, appliedMaxPrice, currentPage]);

  // Refresh listings (after wishlist update)
  const refreshListings = useCallback(async () => {
    // Clear cache when refreshing to ensure fresh data
    cacheRef.current.clear();
    setLastDocMap(new Map()); // Reset pagination state
    setMaxKnownPage(1); // Reset max known page
    await fetchPaginatedListings(currentPage);
  }, [fetchPaginatedListings, currentPage]);

  // Calculate total pages based on what we know about page existence
  const totalPages = useMemo(() => {
    if (items.length === 0 && currentPage === 1) return 1;
    return Math.max(currentPage, maxKnownPage);
  }, [items.length, currentPage, maxKnownPage]);

  // Optimized category/subcategory handlers with better performance
  const handleCategoryClick = useCallback((c: string) => {
    const newCat = c === cat ? "" : c;
    setCat(newCat);
    setSub("");
    setCurrentPage(1); // Reset to first page
    setLastDocMap(new Map()); // Reset pagination state
    setMaxKnownPage(1); // Reset max known page
    cacheRef.current.clear(); // Clear cache
    const params = new URLSearchParams(searchParams);
    if (newCat) params.set("cat", newCat);
    else {
      params.delete("cat");
      params.delete("sub");
    }
    params.delete("page"); // Remove page param when changing category
    navigate({ pathname: "/search", search: params.toString() });
  }, [cat, searchParams, navigate]);

  const handleSubcategoryClick = useCallback((c: string, sc: string) => {
    setCat(c);
    setSub(sc);
    setCurrentPage(1); // Reset to first page
    setLastDocMap(new Map()); // Reset pagination state
    setMaxKnownPage(1); // Reset max known page
    cacheRef.current.clear(); // Clear cache
    const params = new URLSearchParams(searchParams);
    params.set("cat", c);
    params.set("sub", sc);
    params.delete("page"); // Remove page param when changing subcategory
    navigate({ pathname: "/search", search: params.toString() });
  }, [searchParams, navigate]);

  // Optimized page change handler
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    const params = new URLSearchParams(searchParams);
    if (page > 1) {
      params.set("page", page.toString());
    } else {
      params.delete("page");
    }
    navigate({ pathname: "/search", search: params.toString() });
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchParams, navigate]);

  // Generate SEO data based on search parameters
  const searchQuery = searchParams.get("q") || "";
  const categoryFilter = searchParams.get("cat") || "";
  
  const generateSearchSEO = () => {
    let title = "Search Results";
    let description = "Find authentic Sri Lankan products and crafts";
    let keywords = ['search', 'Sri Lankan products', 'marketplace'];
    
    if (searchQuery) {
      title = `Search: ${searchQuery}`;
      description = `Search results for "${searchQuery}" - Find authentic Sri Lankan products and crafts`;
      keywords.push(searchQuery);
    }
    
    if (categoryFilter) {
      title += ` in ${categoryFilter}`;
      description += ` in ${categoryFilter} category`;
      keywords.push(categoryFilter);
    }
    
    return {
      title: `${title} | Sri Lankan Marketplace`,
      description,
      keywords: generateKeywords(keywords)
    };
  };  const seoData = generateSearchSEO();

  // Main JSX
  return (
    <>
      <SEOHead
        title={seoData.title}
        description={seoData.description}
        keywords={seoData.keywords}
        canonicalUrl={getCanonicalUrl('/search')}
        noIndex={!searchQuery && !categoryFilter} // Don't index empty search pages
      />
      <ResponsiveHeader />
      <div className={`w-full min-h-screen ${isMobile ? 'py-4 px-2' : 'py-10 px-1 md:px-4'}`} style={{ backgroundColor: '#ffffff' }}>
        <div className={`flex ${isMobile ? 'flex-col gap-6' : 'flex-col md:flex-row md:gap-10'} w-full`}>
          {/* -------- Sidebar -------- */}
          {isMobile && (
            <div className="mb-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white border rounded-xl shadow-sm"
                style={{ borderColor: 'rgba(114, 176, 29, 0.3)' }}
              >
                <span className="font-medium text-sm" style={{ color: '#0d0a0b' }}>
                  Filters & Categories
                </span>
                <svg 
                  width="16" 
                  height="16" 
                  fill="none" 
                  viewBox="0 0 24 24"
                  className={`transform transition-transform ${showFilters ? 'rotate-180' : ''}`}
                >
                  <path stroke="#72b01d" strokeWidth="2" d="M9 18l6-6-6-6" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          )}
          <aside className={`${isMobile ? (showFilters ? 'block' : 'hidden') : 'w-full md:w-80'} ${isMobile ? 'w-full' : 'mb-8 md:mb-0'} flex flex-col ${isMobile ? 'gap-4' : 'gap-6'}`}>
            {/* Category Filter Card */}
            <div className={`rounded-2xl overflow-hidden shadow-lg border ${isMobile ? 'mx-1' : ''}`} style={{ backgroundColor: '#ffffff', borderColor: 'rgba(114, 176, 29, 0.3)' }}>
              <div className={`flex items-center gap-2 ${isMobile ? 'px-4 py-3' : 'px-6 py-4'} border-b`} style={{ borderBottomColor: 'rgba(114, 176, 29, 0.2)'}}>
                <svg width={isMobile ? "18" : "20"} height={isMobile ? "18" : "20"} fill="none" viewBox="0 0 24 24"><path stroke="#72b01d" strokeWidth="1.5" d="M4 7h16M6 12h12M8 17h8" strokeLinecap="round" /></svg>
                <h2 className={`${isMobile ? 'text-sm' : 'text-base'} font-semibold tracking-tight`} style={{ color: '#0d0a0b' }}>Categories</h2>
              </div>
              <ul className={`flex flex-col gap-1 ${isMobile ? 'px-4 py-4' : 'px-6 py-5'}`}>
                {categories.map((c) => (
                  <li key={c.name} className="flex flex-col">
                    <div className="flex items-center w-full group">
                      <button
                        className={`flex-1 text-left ${isMobile ? 'px-2 py-1.5 text-sm' : 'px-3 py-2'} rounded-lg font-medium transition-all duration-300 ${cat === c.name ? "text-white shadow-lg" : ""}`}
                        style={{
                          backgroundColor: cat === c.name ? '#72b01d' : 'transparent',
                          color: cat === c.name ? '#ffffff' : '#0d0a0b'
                        }}
                        onClick={() => handleCategoryClick(c.name)}
                      >
                        {c.name}
                      </button>
                      <button
                        className="ml-1 p-1 rounded transition-all duration-300"
                        style={{
                          //backgroundColor: 'rgba(114, 176, 29, 0.1)',
                          color: '#72b01d'
                        }}
                        aria-label={expanded === c.name ? `Collapse ${c.name}` : `Expand ${c.name}`}
                        onClick={e => {
                          e.stopPropagation();
                          setExpanded(expanded === c.name ? null : c.name);
                        }}
                      >
                        {expanded === c.name ? (
                          <svg width={isMobile ? "14" : "16"} height={isMobile ? "14" : "16"} fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M18 15l-6-6-6 6" strokeLinecap="round" /></svg>
                        ) : (
                          <svg width={isMobile ? "14" : "16"} height={isMobile ? "14" : "16"} fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M9 18l6-6-6-6" strokeLinecap="round" /></svg>
                        )}
                      </button>
                    </div>
                    {expanded === c.name && c.subcategories && (
                      <ul className={`${isMobile ? 'pl-4 py-2' : 'pl-6 py-2'} flex flex-col gap-1`}>
                        {c.subcategories.map(sc => (
                          <li key={sc}>
                            <button
                              className={`w-full text-left ${isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'} rounded-lg transition-all duration-300 ${sub === sc ? "text-white shadow-lg" : ""}`}
                              style={{
                                backgroundColor: sub === sc ? '#3f7d20' : 'transparent',
                                color: sub === sc ? '#ffffff' : '#454955'
                              }}
                              onClick={() => handleSubcategoryClick(c.name, sc)}
                            >
                              {sc}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
                {/* Reset filter */}
                <li className={`${isMobile ? 'pt-1' : 'pt-2'}`}>
                  <button
                    className={`w-full ${isMobile ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm'} rounded-lg text-left font-semibold transition-all duration-300 disabled:opacity-50`}
                    style={{
                      backgroundColor: (!cat && !sub) ? 'rgba(114, 176, 29, 0.1)' : 'rgba(114, 176, 29, 0.05)',
                      color: '#72b01d'
                    }}
                    onClick={() => {
                      // Clear cache when clearing category filters
                      cacheRef.current.clear();
                      setCat(""); setSub(""); setExpanded(null); setCurrentPage(1);
                      const params = new URLSearchParams(searchParams);
                      params.delete("cat");
                      params.delete("sub");
                      params.delete("page");
                      navigate({ pathname: "/search", search: params.toString() });
                    }}
                    disabled={!cat && !sub}
                  >
                    Clear Filters
                  </button>
                </li>
              </ul>
            </div>

            {/* Additional Filters Card */}
            <div className={`rounded-2xl overflow-hidden shadow-lg border ${isMobile ? 'mx-1' : ''}`} style={{ backgroundColor: '#ffffff', borderColor: 'rgba(114, 176, 29, 0.3)' }}>
              <div className={`flex items-center gap-2 ${isMobile ? 'px-4 py-3' : 'px-6 py-4'} border-b`} style={{ borderBottomColor: 'rgba(114, 176, 29, 0.2)' }}>
                <svg width={isMobile ? "18" : "20"} height={isMobile ? "18" : "20"} fill="none" viewBox="0 0 24 24"><path stroke="#72b01d" strokeWidth="1.5" d="M3 6h18M6 12h12M10 18h4" strokeLinecap="round" /></svg>
                <h2 className={`${isMobile ? 'text-sm' : 'text-base'} font-semibold tracking-tight`} style={{ color: '#0d0a0b' }}>More Filters</h2>
              </div>
              <div className={`flex flex-col ${isMobile ? 'gap-4' : 'gap-6'} ${isMobile ? 'px-4 py-4' : 'px-6 py-6'}`}>
                {/* Price Range */}
                <div>
                  <label className={`block ${isMobile ? 'text-xs' : 'text-xs'} font-semibold mb-2`} style={{ color: '#454955' }}>Price Range (LKR)</label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="number"
                      min="0"
                      className={`w-1/2 ${isMobile ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm'} rounded-lg border outline-none transition-all`}
                      style={{
                        backgroundColor: '#ffffff',
                        borderColor: 'rgba(114, 176, 29, 0.3)',
                        color: '#0d0a0b'
                      }}
                      placeholder="Min"
                      value={filterMinPrice}
                      onChange={e => setFilterMinPrice(e.target.value)}
                    />
                    <span className={`${isMobile ? 'text-xs' : 'text-xs'}`} style={{ color: '#454955' }}>—</span>
                    <Input
                      type="number"
                      min="0"
                      className={`w-1/2 ${isMobile ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm'} rounded-lg border outline-none transition-all`}
                      style={{
                        backgroundColor: '#ffffff',
                        borderColor: 'rgba(114, 176, 29, 0.3)',
                        color: '#0d0a0b'
                      }}
                      placeholder="Max"
                      value={filterMaxPrice}
                      onChange={e => setFilterMaxPrice(e.target.value)}
                    />
                  </div>
                </div>
                <div className="border-t" style={{ borderTopColor: 'rgba(114, 176, 29, 0.2)' }} />
                {/* Sort By */}
                <div>
                  <label className={`block ${isMobile ? 'text-xs' : 'text-xs'} font-semibold mb-2`} style={{ color: '#454955' }}>Sort By</label>
                  <select
                    className={`w-full ${isMobile ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm'} rounded-lg border outline-none transition-all`}
                    style={{
                      backgroundColor: '#ffffff',
                      borderColor: 'rgba(114, 176, 29, 0.3)',
                      color: '#0d0a0b'
                    }}
                    value={filterSort}
                    onChange={e => setFilterSort(e.target.value)}
                  >
                    <option value="">Default</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="newest">Newest</option>
                  </select>
                </div>
                <div className="border-t" style={{ borderTopColor: 'rgba(114, 176, 29, 0.2)' }} />
                {/* Free Shipping */}
                <div className="flex items-center gap-2">
                  <input
                    id="free-shipping"
                    type="checkbox"
                    checked={filterFreeShipping}
                    onChange={e => setFilterFreeShipping(e.target.checked)}
                    className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} rounded`}
                    style={{ accentColor: '#72b01d' }}
                  />
                  <label htmlFor="free-shipping" className={`${isMobile ? 'text-xs' : 'text-sm'} select-none cursor-pointer`} style={{ color: '#454955' }}>Free Shipping Only</label>
                </div>
                <div className={`flex gap-2 ${isMobile ? 'mt-1' : 'mt-2'}`}>
                  <Button
                    className={`flex-1 ${isMobile ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'} rounded-lg text-white font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5`}
                    style={{
                      background: 'linear-gradient(to right, #72b01d, #3f7d20)'
                    }}
                    onClick={() => {
                      // Clear cache when applying new filters
                      cacheRef.current.clear();
                      setAppliedMinPrice(filterMinPrice);
                      setAppliedMaxPrice(filterMaxPrice);
                      setAppliedSort(filterSort);
                      setAppliedFreeShipping(filterFreeShipping);
                      setCurrentPage(1); // Reset to first page when applying filters
                      const params = new URLSearchParams(searchParams);
                      if (filterMinPrice) params.set("min", filterMinPrice); else params.delete("min");
                      if (filterMaxPrice) params.set("max", filterMaxPrice); else params.delete("max");
                      if (filterSort) params.set("sort", filterSort); else params.delete("sort");
                      if (filterFreeShipping) params.set("free", "1"); else params.delete("free");
                      params.delete("page"); // Reset page when applying filters
                      navigate({ pathname: "/search", search: params.toString() });
                      if (isMobile) setShowFilters(false); // Hide filters on mobile after applying
                    }}
                  >
                    Apply Filters
                  </Button>
                  <Button
                    variant="outline"
                    className={`flex-1 ${isMobile ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'} rounded-lg font-semibold transition-all duration-300 border`}
                    style={{
                      backgroundColor: 'rgba(114, 176, 29, 0.1)',
                      color: '#72b01d',
                      borderColor: 'rgba(114, 176, 29, 0.3)'
                    }}
                    onClick={() => {
                      // Clear cache when resetting filters
                      cacheRef.current.clear();
                      setFilterMinPrice("");
                      setFilterMaxPrice("");
                      setFilterSort("");
                      setFilterFreeShipping(false);
                      setAppliedMinPrice("");
                      setAppliedMaxPrice("");
                      setAppliedSort("");
                      setAppliedFreeShipping(false);
                      setCurrentPage(1); // Reset to first page when resetting filters
                      const params = new URLSearchParams(searchParams);
                      params.delete("min");
                      params.delete("max");
                      params.delete("sort");
                      params.delete("free");
                      params.delete("page"); // Reset page when resetting filters
                      navigate({ pathname: "/search", search: params.toString() });
                      if (isMobile) setShowFilters(false); // Hide filters on mobile after resetting
                    }}
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </div>
          </aside>
          {/* --------- Main Search/Results --------- */}
          <main className="flex-1">
            {/* Search Bar */}
            <div className={`${isMobile ? 'mb-4' : 'mb-8'}`}>
              <form
                className="flex w-full gap-0"
                onSubmit={e => {
                  e.preventDefault();
                  // Clear cache when performing new search
                  cacheRef.current.clear();
                  setAppliedSearch(searchInput);
                  setCurrentPage(1); // Reset to first page when searching
                  const params = new URLSearchParams(searchParams);
                  if (searchInput) params.set("q", searchInput);
                  else params.delete("q");
                  params.delete("page"); // Reset page when searching
                  navigate({ pathname: "/search", search: params.toString() });
                }}
              >
                <Input
                  className={`flex-1 outline-none ${isMobile ? 'px-3 py-2 text-base' : 'px-5 py-3 text-lg'} rounded-l-xl font-medium transition border border-r-0`}
                  style={{
                    backgroundColor: '#ffffff',
                    borderColor: 'rgba(114, 176, 29, 0.3)',
                    color: '#0d0a0b'
                  }}
                  placeholder="Search products..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  aria-label="Search products"
                />
                <Button
                  type="submit"
                  className={`${isMobile ? 'px-4 py-2 text-base' : 'px-6 py-3 text-lg'} rounded-r-xl text-white font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 border`}
                  style={{
                    background: 'linear-gradient(to right, #72b01d, #3f7d20)',
                    borderColor: 'rgba(114, 176, 29, 0.3)'
                  }}
                  aria-label="Search"
                >
                  {isMobile ? (
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                      <path stroke="currentColor" strokeWidth="2" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"/>
                    </svg>
                  ) : (
                    'Search'
                  )}
                </Button>
              </form>
            </div>
            {/* Results header with active filters */}
            {(appliedSearch || cat || sub || appliedMinPrice || appliedMaxPrice || appliedSort || appliedFreeShipping) && (
              <div className={`${isMobile ? 'mb-2' : 'mb-3'}`}>
                <div className={`flex ${isMobile ? 'flex-col gap-2' : 'flex-col sm:flex-row sm:items-center sm:justify-between gap-4'}`}>
                  
                  {/* Active filters summary */}
                  <div className={`flex flex-wrap ${isMobile ? 'gap-1' : 'gap-2'}`}>
                    {appliedSearch && (
                      <span className={`inline-flex items-center gap-1 ${isMobile ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs'} rounded-full font-medium border`} 
                            style={{ backgroundColor: 'rgba(114, 176, 29, 0.1)', borderColor: 'rgba(114, 176, 29, 0.3)', color: '#72b01d' }}>
                        Search: "{appliedSearch}"
                        <button 
                          onClick={() => {
                            setSearchInput('');
                            setAppliedSearch('');
                            const params = new URLSearchParams(searchParams);
                            params.delete('q');
                            navigate({ pathname: "/search", search: params.toString() });
                          }}
                          className="ml-1 hover:bg-red-100 rounded-full p-0.5"
                        >
                          <svg width={isMobile ? "10" : "12"} height={isMobile ? "10" : "12"} fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" strokeWidth="2" d="M18 6L6 18M6 6l12 12"/>
                          </svg>
                        </button>
                      </span>
                    )}
                    
                    {cat && (
                      <span className={`inline-flex items-center gap-1 ${isMobile ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs'} rounded-full font-medium border`} 
                            style={{ backgroundColor: 'rgba(114, 176, 29, 0.1)', borderColor: 'rgba(114, 176, 29, 0.3)', color: '#72b01d' }}>
                        Category: {cat}
                        <button 
                          onClick={() => handleCategoryClick(cat)}
                          className="ml-1 hover:bg-red-100 rounded-full p-0.5"
                        >
                          <svg width={isMobile ? "10" : "12"} height={isMobile ? "10" : "12"} fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" strokeWidth="2" d="M18 6L6 18M6 6l12 12"/>
                          </svg>
                        </button>
                      </span>
                    )}
                    
                    {sub && (
                      <span className={`inline-flex items-center gap-1 ${isMobile ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs'} rounded-full font-medium border`} 
                            style={{ backgroundColor: 'rgba(114, 176, 29, 0.1)', borderColor: 'rgba(114, 176, 29, 0.3)', color: '#72b01d' }}>
                        {sub}
                      </span>
                    )}
                    
                    {appliedMinPrice && (
                      <span className={`inline-flex items-center gap-1 ${isMobile ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs'} rounded-full font-medium border`} 
                            style={{ backgroundColor: 'rgba(114, 176, 29, 0.1)', borderColor: 'rgba(114, 176, 29, 0.3)', color: '#72b01d' }}>
                        Min: ${appliedMinPrice}
                      </span>
                    )}
                    
                    {appliedMaxPrice && (
                      <span className={`inline-flex items-center gap-1 ${isMobile ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs'} rounded-full font-medium border`} 
                            style={{ backgroundColor: 'rgba(114, 176, 29, 0.1)', borderColor: 'rgba(114, 176, 29, 0.3)', color: '#72b01d' }}>
                        Max: ${appliedMaxPrice}
                      </span>
                    )}
                    
                    {appliedSort && (
                      <span className={`inline-flex items-center gap-1 ${isMobile ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs'} rounded-full font-medium border`} 
                            style={{ backgroundColor: 'rgba(114, 176, 29, 0.1)', borderColor: 'rgba(114, 176, 29, 0.3)', color: '#72b01d' }}>
                        Sort: {appliedSort === 'price-asc' ? 'Price ↑' : appliedSort === 'price-desc' ? 'Price ↓' : appliedSort === 'newest' ? 'Newest' : appliedSort}
                      </span>
                    )}
                    
                    {appliedFreeShipping && (
                      <span className={`inline-flex items-center gap-1 ${isMobile ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs'} rounded-full font-medium border`} 
                            style={{ backgroundColor: 'rgba(114, 176, 29, 0.1)', borderColor: 'rgba(114, 176, 29, 0.3)', color: '#72b01d' }}>
                        Free Shipping
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
            {/* Results grid */}
            {searching ? (
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* Loading skeleton */}
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 rounded-2xl h-64 mb-3"></div>
                    <div className="bg-gray-200 rounded h-4 mb-2"></div>
                    <div className="bg-gray-200 rounded h-4 w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : (
              <WithReviewStats listings={items}>
                {(listingsWithStats) => (
                  <div className={`w-full grid grid-cols-1 ${isMobile ? 'gap-3' : 'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'}`}>
                    {listingsWithStats.map((item: any) => (
                      <ResponsiveListingTile 
                        key={item.id}
                        listing={item}
                        onRefresh={refreshListings}
                        compact={true}
                      />
                    ))}
                    {items.length === 0 && !searching && (
                      <div className="col-span-full text-center text-gray-400 text-lg py-20">
                        No products found.
                      </div>
                    )}
                  </div>
                )}
              </WithReviewStats>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className={`${isMobile ? 'mt-8' : 'mt-12'} flex items-center justify-center`}>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  totalItems={items.length}
                  showInfo={!isMobile}
                  showJumpTo={totalPages > 10 && !isMobile}
                />
              </div>
            )}
          </main>
        </div>
      </div>
      
      {/* Back to Top Button */}
      <BackToTop />
      
      <Footer />
    </>
  );
};

export default Search;
