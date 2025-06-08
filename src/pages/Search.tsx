import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "../utils/firebase";
import { categories } from "../utils/categories";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Header, ListingTile, Button, Input, Pagination, BackToTop } from "../components/UI";
import Footer from "../components/UI/Footer";
import { getUserIP } from "../utils/ipUtils";

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

  // For sidebar filter
  const [expanded, setExpanded] = useState<string | null>(null);

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

  // Optimized query builder
  const buildOptimizedQuery = useCallback(() => {
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
    }

    // Add limit for better performance
    queryConstraints.push(limit(100));

    return query(collection(db, "listings"), ...queryConstraints);
  }, [cat, sub, appliedFreeShipping, appliedSort]);

  // Optimized fetch function with caching
  const fetchOptimizedListings = useCallback(async () => {
    if (!ip) return;
    
    // Create cache key from current filters
    const cacheKey = JSON.stringify({
      cat,
      sub,
      appliedFreeShipping,
      appliedSort,
      appliedSearch,
      appliedMinPrice,
      appliedMaxPrice,
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
      const optimizedQuery = buildOptimizedQuery();
      const snapshot = await getDocs(optimizedQuery);
      
      let results: Listing[] = snapshot.docs.map(doc => ({
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
    } finally {
      setSearching(false);
    }
  }, [ip, buildOptimizedQuery, appliedSearch, appliedMinPrice, appliedMaxPrice, cat, sub, appliedFreeShipping, appliedSort]);

  // Fetch listings when dependencies change
  useEffect(() => {
    if (ip !== null) {
      fetchOptimizedListings();
    }
  }, [fetchOptimizedListings]);

  // Refresh listings (after wishlist update)
  const refreshListings = useCallback(async () => {
    // Clear cache when refreshing to ensure fresh data
    cacheRef.current.clear();
    await fetchOptimizedListings();
  }, [fetchOptimizedListings]);

  // Memoized filtered and paginated results for better performance
  const { paginatedItems, totalItems, totalPages, startIndex, endIndex } = useMemo(() => {
    const total = items.length;
    const pages = Math.ceil(total / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginated = items.slice(start, end);
    
    return {
      paginatedItems: paginated,
      totalItems: total,
      totalPages: pages,
      startIndex: start,
      endIndex: end
    };
  }, [items, currentPage, itemsPerPage]);

  // Optimized category/subcategory handlers with better performance
  const handleCategoryClick = useCallback((c: string) => {
    const newCat = c === cat ? "" : c;
    setCat(newCat);
    setSub("");
    setCurrentPage(1); // Reset to first page
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

  // Main JSX
  return (
    <>
      <Header />
      <div className="w-full min-h-screen py-10 px-1 md:px-4" style={{ backgroundColor: '#ffffff' }}>
        <div className="flex flex-col md:flex-row gap-10 w-full">
          {/* -------- Sidebar -------- */}
          <aside className="w-full md:w-80 mb-8 md:mb-0 flex flex-col gap-6">
            {/* Category Filter Card */}
            <div className="rounded-2xl overflow-hidden shadow-lg border" style={{ backgroundColor: '#ffffff', borderColor: 'rgba(114, 176, 29, 0.3)' }}>
              <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderBottomColor: 'rgba(114, 176, 29, 0.2)'}}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="#72b01d" strokeWidth="1.5" d="M4 7h16M6 12h12M8 17h8" strokeLinecap="round" /></svg>
                <h2 className="text-base font-semibold tracking-tight" style={{ color: '#0d0a0b' }}>Categories</h2>
              </div>
              <ul className="flex flex-col gap-1 px-4 py-4">
                {categories.map((c) => (
                  <li key={c.name} className="flex flex-col">
                    <div className="flex items-center w-full group">
                      <button
                        className={`flex-1 text-left px-3 py-2 rounded-lg font-medium transition-all duration-300 ${cat === c.name ? "text-white shadow-lg" : ""}`}
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
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M18 15l-6-6-6 6" strokeLinecap="round" /></svg>
                        ) : (
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M9 18l6-6-6-6" strokeLinecap="round" /></svg>
                        )}
                      </button>
                    </div>
                    {expanded === c.name && c.subcategories && (
                      <ul className="pl-4 py-1 flex flex-col gap-1">
                        {c.subcategories.map(sc => (
                          <li key={sc}>
                            <button
                              className={`w-full text-left px-3 py-1.5 rounded-lg transition-all duration-300 text-sm ${sub === sc ? "text-white shadow-lg" : ""}`}
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
                <li className="pt-2">
                  <button
                    className="w-full px-3 py-2 rounded-lg text-left text-sm font-semibold transition-all duration-300 disabled:opacity-50"
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
            <div className="rounded-2xl overflow-hidden shadow-lg border" style={{ backgroundColor: '#ffffff', borderColor: 'rgba(114, 176, 29, 0.3)' }}>
              <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderBottomColor: 'rgba(114, 176, 29, 0.2)' }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="#72b01d" strokeWidth="1.5" d="M3 6h18M6 12h12M10 18h4" strokeLinecap="round" /></svg>
                <h2 className="text-base font-semibold tracking-tight" style={{ color: '#0d0a0b' }}>More Filters</h2>
              </div>
              <div className="flex flex-col gap-5 px-4 py-4">
                {/* Price Range */}
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: '#454955' }}>Price Range (LKR)</label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="number"
                      min="0"
                      className="w-1/2 px-3 py-2 rounded-lg border outline-none transition-all text-sm"
                      style={{
                        backgroundColor: '#ffffff',
                        borderColor: 'rgba(114, 176, 29, 0.3)',
                        color: '#0d0a0b'
                      }}
                      placeholder="Min"
                      value={filterMinPrice}
                      onChange={e => setFilterMinPrice(e.target.value)}
                    />
                    <span className="text-xs" style={{ color: '#454955' }}>—</span>
                    <Input
                      type="number"
                      min="0"
                      className="w-1/2 px-3 py-2 rounded-lg border outline-none transition-all text-sm"
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
                  <label className="block text-xs font-semibold mb-2" style={{ color: '#454955' }}>Sort By</label>
                  <select
                    className="w-full px-3 py-2 rounded-lg border outline-none transition-all text-sm"
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
                    className="w-4 h-4 rounded"
                    style={{ accentColor: '#72b01d' }}
                  />
                  <label htmlFor="free-shipping" className="text-sm select-none cursor-pointer" style={{ color: '#454955' }}>Free Shipping Only</label>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button
                    className="flex-1 px-4 py-2 rounded-lg text-white font-semibold transition-all duration-300 text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
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
                    }}
                  >
                    Apply Filters
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 px-4 py-2 rounded-lg font-semibold transition-all duration-300 text-sm border"
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
            <div className="mb-8">
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
                  className="flex-1 outline-none px-5 py-3 rounded-l-xl font-medium text-lg transition border border-r-0"
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
                  className="px-6 py-3 rounded-r-xl text-white font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 border"
                  style={{
                    background: 'linear-gradient(to right, #72b01d, #3f7d20)',
                    borderColor: 'rgba(114, 176, 29, 0.3)'
                  }}
                  aria-label="Search"
                >
                  Search
                </Button>
              </form>
            </div>
            {/* Results header with count and active filters */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Results count */}
                <div className="flex flex-col">
                  <p className="text-lg font-semibold" style={{ color: '#0d0a0b' }}>
                    {totalItems} {totalItems === 1 ? 'Product' : 'Products'} Found
                  </p>
                  <p className="text-sm" style={{ color: '#454955' }}>
                    Showing {Math.min(startIndex + 1, totalItems)}-{Math.min(endIndex, totalItems)}
                    {currentPage > 1 && ` • Page ${currentPage} of ${totalPages}`}
                  </p>
                </div>
                
                {/* Active filters summary */}
                {(appliedSearch || cat || sub || appliedMinPrice || appliedMaxPrice || appliedSort || appliedFreeShipping) && (
                  <div className="flex flex-wrap gap-2">
                    {appliedSearch && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border" 
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
                          <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" strokeWidth="2" d="M18 6L6 18M6 6l12 12"/>
                          </svg>
                        </button>
                      </span>
                    )}
                    
                    {cat && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border" 
                            style={{ backgroundColor: 'rgba(114, 176, 29, 0.1)', borderColor: 'rgba(114, 176, 29, 0.3)', color: '#72b01d' }}>
                        Category: {cat}
                        <button 
                          onClick={() => handleCategoryClick(cat)}
                          className="ml-1 hover:bg-red-100 rounded-full p-0.5"
                        >
                          <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" strokeWidth="2" d="M18 6L6 18M6 6l12 12"/>
                          </svg>
                        </button>
                      </span>
                    )}
                    
                    {sub && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border" 
                            style={{ backgroundColor: 'rgba(114, 176, 29, 0.1)', borderColor: 'rgba(114, 176, 29, 0.3)', color: '#72b01d' }}>
                        {sub}
                      </span>
                    )}
                    
                    {appliedMinPrice && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border" 
                            style={{ backgroundColor: 'rgba(114, 176, 29, 0.1)', borderColor: 'rgba(114, 176, 29, 0.3)', color: '#72b01d' }}>
                        Min: ${appliedMinPrice}
                      </span>
                    )}
                    
                    {appliedMaxPrice && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border" 
                            style={{ backgroundColor: 'rgba(114, 176, 29, 0.1)', borderColor: 'rgba(114, 176, 29, 0.3)', color: '#72b01d' }}>
                        Max: ${appliedMaxPrice}
                      </span>
                    )}
                    
                    {appliedSort && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border" 
                            style={{ backgroundColor: 'rgba(114, 176, 29, 0.1)', borderColor: 'rgba(114, 176, 29, 0.3)', color: '#72b01d' }}>
                        Sort: {appliedSort === 'price-asc' ? 'Price ↑' : appliedSort === 'price-desc' ? 'Price ↓' : appliedSort === 'newest' ? 'Newest' : appliedSort}
                      </span>
                    )}
                    
                    {appliedFreeShipping && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border" 
                            style={{ backgroundColor: 'rgba(114, 176, 29, 0.1)', borderColor: 'rgba(114, 176, 29, 0.3)', color: '#72b01d' }}>
                        Free Shipping
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
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
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {paginatedItems.map((item: Listing) => (
                  <ListingTile 
                    key={item.id}
                    listing={item}
                    onRefresh={refreshListings}
                    compact={true}
                  />
                ))}
                {paginatedItems.length === 0 && !searching && (
                  <div className="col-span-full text-center text-gray-400 text-lg py-20">
                    No products found.
                  </div>
                )}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  totalItems={totalItems}
                  startIndex={startIndex}
                  endIndex={Math.min(endIndex, totalItems)}
                  showInfo={true}
                  showJumpTo={totalPages > 10}
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
