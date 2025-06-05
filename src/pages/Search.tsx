import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../utils/firebase";
import { categories } from "../utils/categories";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import Header from "../components/UI/Header";
import WishlistButton from "../components/UI/WishlistButton";
import { useAuth } from "../context/AuthContext";
import { getUserIP } from "../utils/ipUtils";

const Search: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  // For sidebar filter
  const [expanded, setExpanded] = useState<string | null>(null);

  // Listings & user IP
  const [items, setItems] = useState<any[]>([]);
  const [ip, setIp] = useState<string | null>(null);

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

  // Get user's IP and fetch all listings with wishlist arrays
  useEffect(() => {
    (async () => {
      const userIp = await getUserIP();
      setIp(userIp);
      const snap = await getDocs(collection(db, "listings"));
      setItems(
        snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          __client_ip: userIp,
        }))
      );
    })();
  }, []);

  // Refresh listings (after wishlist update)
  const refreshListings = async () => {
    const snap = await getDocs(collection(db, "listings"));
    setItems(
      snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        __client_ip: ip,
      }))
    );
  };

  function getReviewStats(listing: any) {
    const reviews = Array.isArray(listing.reviews) ? listing.reviews : [];
    if (!reviews.length) return { avg: null, count: 0 };
    const avg = reviews.reduce((sum: any, r: any) => sum + (r.rating || 0), 0) / reviews.length;
    return { avg, count: reviews.length };
  }

  // FILTERING logic (in memory)
  let filtered = items.filter(
    (item) =>
      (appliedSearch === "" || item.name?.toLowerCase().includes(appliedSearch.toLowerCase())) &&
      (cat === "" || item.category === cat) &&
      (sub === "" || item.subcategory === sub)
  );
  if (appliedMinPrice !== "") filtered = filtered.filter(item => Number(item.price) >= Number(appliedMinPrice));
  if (appliedMaxPrice !== "") filtered = filtered.filter(item => Number(item.price) <= Number(appliedMaxPrice));
  if (appliedFreeShipping) filtered = filtered.filter(item => item.deliveryType === "free");
  if (appliedSort === "price-asc") filtered = [...filtered].sort((a, b) => Number(a.price) - Number(b.price));
  else if (appliedSort === "price-desc") filtered = [...filtered].sort((a, b) => Number(b.price) - Number(a.price));
  else if (appliedSort === "newest") filtered = [...filtered].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  // Pagination calculations
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filtered.slice(startIndex, endIndex);

  // Category/subcategory sidebar navigation handlers
  const handleCategoryClick = (c: string) => {
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
  };

  const handleSubcategoryClick = (c: string, sc: string) => {
    setCat(c);
    setSub(sc);
    setCurrentPage(1); // Reset to first page
    const params = new URLSearchParams(searchParams);
    params.set("cat", c);
    params.set("sub", sc);
    params.delete("page"); // Remove page param when changing subcategory
    navigate({ pathname: "/search", search: params.toString() });
  };

  // Handle page changes
  const handlePageChange = (page: number) => {
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
  };

  // Main JSX
  return (
    <>
      <Header />
      <div className="w-full min-h-screen py-10 px-2 md:px-8" style={{ backgroundColor: '#f3eff5' }}>
        <div className="flex flex-col md:flex-row gap-10 w-full">
          {/* -------- Sidebar -------- */}
          <aside className="w-full md:w-80 mb-8 md:mb-0 flex flex-col gap-6">
            {/* Category Filter Card */}
            <div className="rounded-2xl overflow-hidden shadow-lg border" style={{ backgroundColor: '#f3eff5', borderColor: 'rgba(114, 176, 29, 0.3)' }}>
              <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderBottomColor: 'rgba(114, 176, 29, 0.2)', backgroundColor: 'rgba(114, 176, 29, 0.1)' }}>
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
                          color: cat === c.name ? '#f3eff5' : '#0d0a0b'
                        }}
                        onClick={() => handleCategoryClick(c.name)}
                      >
                        {c.name}
                      </button>
                      <button
                        className="ml-1 p-1 rounded transition-all duration-300"
                        style={{
                          backgroundColor: 'rgba(114, 176, 29, 0.1)',
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
                                color: sub === sc ? '#f3eff5' : '#454955'
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
            <div className="rounded-2xl overflow-hidden shadow-lg border" style={{ backgroundColor: '#f3eff5', borderColor: 'rgba(114, 176, 29, 0.3)' }}>
              <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderBottomColor: 'rgba(114, 176, 29, 0.2)', backgroundColor: 'rgba(114, 176, 29, 0.1)' }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="#72b01d" strokeWidth="1.5" d="M3 6h18M6 12h12M10 18h4" strokeLinecap="round" /></svg>
                <h2 className="text-base font-semibold tracking-tight" style={{ color: '#0d0a0b' }}>More Filters</h2>
              </div>
              <div className="flex flex-col gap-5 px-4 py-4">
                {/* Price Range */}
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: '#454955' }}>Price Range (LKR)</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      min="0"
                      className="w-1/2 px-3 py-2 rounded-lg border outline-none transition-all text-sm"
                      style={{
                        backgroundColor: 'rgba(243, 239, 245, 0.8)',
                        borderColor: 'rgba(114, 176, 29, 0.3)',
                        color: '#0d0a0b'
                      }}
                      placeholder="Min"
                      value={filterMinPrice}
                      onChange={e => setFilterMinPrice(e.target.value)}
                    />
                    <span className="text-xs" style={{ color: '#454955' }}>—</span>
                    <input
                      type="number"
                      min="0"
                      className="w-1/2 px-3 py-2 rounded-lg border outline-none transition-all text-sm"
                      style={{
                        backgroundColor: 'rgba(243, 239, 245, 0.8)',
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
                      backgroundColor: 'rgba(243, 239, 245, 0.8)',
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
                  <button
                    className="flex-1 px-4 py-2 rounded-lg text-white font-semibold transition-all duration-300 text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    style={{
                      background: 'linear-gradient(to right, #72b01d, #3f7d20)'
                    }}
                    onClick={() => {
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
                  </button>
                  <button
                    className="flex-1 px-4 py-2 rounded-lg font-semibold transition-all duration-300 text-sm border"
                    style={{
                      backgroundColor: 'rgba(114, 176, 29, 0.1)',
                      color: '#72b01d',
                      borderColor: 'rgba(114, 176, 29, 0.3)'
                    }}
                    onClick={() => {
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
                  </button>
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
                  setCurrentPage(1); // Reset to first page when searching
                  const params = new URLSearchParams(searchParams);
                  if (searchInput) params.set("q", searchInput);
                  else params.delete("q");
                  params.delete("page"); // Reset page when searching
                  navigate({ pathname: "/search", search: params.toString() });
                }}
              >
                <input
                  className="flex-1 outline-none px-5 py-3 rounded-l-xl font-medium text-lg transition border border-r-0"
                  style={{
                    backgroundColor: '#f3eff5',
                    borderColor: 'rgba(114, 176, 29, 0.3)',
                    color: '#0d0a0b'
                  }}
                  placeholder="Search products..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  aria-label="Search products"
                />
                <button
                  type="submit"
                  className="px-6 py-3 rounded-r-xl text-white font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 border"
                  style={{
                    background: 'linear-gradient(to right, #72b01d, #3f7d20)',
                    borderColor: 'rgba(114, 176, 29, 0.3)'
                  }}
                  aria-label="Search"
                >
                  Search
                </button>
              </form>
            </div>
            {/* Results header with count */}
            <div className="mb-6">
              <p className="text-sm" style={{ color: '#454955' }}>
                Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} results
                {currentPage > 1 && ` (Page ${currentPage} of ${totalPages})`}
              </p>
            </div>
            {/* Results grid */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-7">
              {paginatedItems.map((item) => (
                <Link
                  key={item.id}
                  to={`/listing/${item.id}`}
                  className="group flex flex-col rounded-2xl shadow-lg transition-all duration-300 p-4 relative cursor-pointer border hover:shadow-xl hover:-translate-y-1"
                  style={{
                    textDecoration: 'none',
                    backgroundColor: '#f3eff5',
                    borderColor: 'rgba(114, 176, 29, 0.3)'
                  }}
                >
                  {/* Wishlist Button (top right) */}

                  {/* Image */}
                  <div className="w-full aspect-square rounded-xl mb-4 flex items-center justify-center overflow-hidden border transition-all duration-300 group-hover:shadow-md"
                    style={{
                      backgroundColor: 'rgba(243, 239, 245, 0.5)',
                      borderColor: 'rgba(114, 176, 29, 0.2)'
                    }}>
                    {item.images && item.images.length > 0 ? (
                      <img
                        src={item.images[0]}
                        alt={item.name}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <span className="text-4xl" style={{ color: '#454955' }}>🖼️</span>
                    )}
                  </div>
                  <h3 className="font-extrabold text-lg mb-1 truncate transition-colors duration-300"
                    style={{ color: '#0d0a0b' }}>
                    {item.name}
                  </h3>
                  {/* Show product average rating and count */}
                  {(() => {
                    const stats = getReviewStats(item);
                    return (
                      <div className="flex items-center gap-2 mb-1 min-h-[22px]">
                        {stats.avg ? (
                          <>
                            <span className="flex items-center text-yellow-500">
                              {[1, 2, 3, 4, 5].map(i => (
                                <svg
                                  key={i}
                                  width="16"
                                  height="16"
                                  className="inline-block"
                                  fill={i <= Math.round(stats.avg) ? "currentColor" : "none"}
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                </svg>
                              ))}
                              <span className="ml-1 text-xs font-bold text-yellow-700">
                                {stats.avg.toFixed(1)}
                              </span>
                            </span>
                            <span className="text-xs text-gray-500">({stats.count})</span>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400">No reviews yet</span>
                        )}
                      </div>
                    );
                  })()}
                  {/* Delivery & Payment badges */}
                  <div className="flex items-center gap-2 mb-2">
                    {item.deliveryType === "free" ? (
                      <span className="inline-flex items-center gap-2 py-0.5 rounded-full text-green-700 text-xs font-semibold">
                        <span className="text-base">🚚</span>
                        Free Delivery
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 py-0.5 rounded-full text-gray-500 text-xs font-medium">
                        <span className="text-base">📦</span>
                        Delivery Fee will apply
                      </span>
                    )}
                    {item.cashOnDelivery && (
                      <span className="inline-flex items-center gap-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold ml-2 px-2">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        COD
                      </span>
                    )}
                  </div>
                  {/* Price & Wishlist bottom row */}
                  <div className="flex items-end justify-between mt-auto">
                    <div className="font-bold text-lg text-black group-hover:text-black tracking-tight">
                      LKR {item.price?.toLocaleString()}
                    </div>
                    <div className="ml-2 flex-shrink-0 flex items-end">
                      <WishlistButton listing={item} refresh={refreshListings} />
                    </div>
                  </div>
                </Link>
              ))}
              {paginatedItems.length === 0 && (
                <div className="col-span-full text-center text-gray-400 text-lg py-20">
                  No products found.
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-2">
                {/* Previous button */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: '#f3eff5',
                    color: '#454955',
                    border: '1px solid rgba(114, 176, 29, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    if (currentPage !== 1) {
                      e.currentTarget.style.backgroundColor = '#72b01d';
                      e.currentTarget.style.color = '#f3eff5';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentPage !== 1) {
                      e.currentTarget.style.backgroundColor = '#f3eff5';
                      e.currentTarget.style.color = '#454955';
                    }
                  }}
                  aria-label="Previous page"
                >
                  ← Previous
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-1">
                  {/* First page */}
                  {currentPage > 3 && (
                    <>
                      <button
                        onClick={() => handlePageChange(1)}
                        className="w-10 h-10 rounded-lg font-medium transition"
                        style={{
                          backgroundColor: '#f3eff5',
                          color: '#454955',
                          border: '1px solid rgba(114, 176, 29, 0.3)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#72b01d';
                          e.currentTarget.style.color = '#f3eff5';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#f3eff5';
                          e.currentTarget.style.color = '#454955';
                        }}
                      >
                        1
                      </button>
                      {currentPage > 4 && (
                        <span className="px-2" style={{ color: '#454955' }}>...</span>
                      )}
                    </>
                  )}

                  {/* Pages around current */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    if (pageNum < 1 || pageNum > totalPages) return null;
                    if (currentPage > 3 && pageNum === 1) return null;
                    if (currentPage < totalPages - 2 && pageNum === totalPages) return null;

                    const isCurrentPage = currentPage === pageNum;

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className="w-10 h-10 rounded-lg font-medium transition"
                        style={{
                          backgroundColor: isCurrentPage ? '#72b01d' : '#f3eff5',
                          color: isCurrentPage ? '#f3eff5' : '#454955',
                          border: `1px solid ${isCurrentPage ? '#72b01d' : 'rgba(114, 176, 29, 0.3)'}`
                        }}
                        onMouseEnter={(e) => {
                          if (!isCurrentPage) {
                            e.currentTarget.style.backgroundColor = '#72b01d';
                            e.currentTarget.style.color = '#f3eff5';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isCurrentPage) {
                            e.currentTarget.style.backgroundColor = '#f3eff5';
                            e.currentTarget.style.color = '#454955';
                          }
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  {/* Last page */}
                  {currentPage < totalPages - 2 && (
                    <>
                      {currentPage < totalPages - 3 && (
                        <span className="px-2" style={{ color: '#454955' }}>...</span>
                      )}
                      <button
                        onClick={() => handlePageChange(totalPages)}
                        className="w-10 h-10 rounded-lg font-medium transition"
                        style={{
                          backgroundColor: '#f3eff5',
                          color: '#454955',
                          border: '1px solid rgba(114, 176, 29, 0.3)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#72b01d';
                          e.currentTarget.style.color = '#f3eff5';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#f3eff5';
                          e.currentTarget.style.color = '#454955';
                        }}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>

                {/* Next button */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: '#f3eff5',
                    color: '#454955',
                    border: '1px solid rgba(114, 176, 29, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    if (currentPage !== totalPages) {
                      e.currentTarget.style.backgroundColor = '#72b01d';
                      e.currentTarget.style.color = '#f3eff5';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentPage !== totalPages) {
                      e.currentTarget.style.backgroundColor = '#f3eff5';
                      e.currentTarget.style.color = '#454955';
                    }
                  }}
                  aria-label="Next page"
                >
                  Next →
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
};

export default Search;
