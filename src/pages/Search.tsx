import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../utils/firebase";
import { categories } from "../utils/categories";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import WishlistButton from "../components/UI/WishlistButton";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";
import Header from "../components/UI/Header";

const Search = () => {
  const navigate = useNavigate();
  // Read query params for cat/sub
  const [searchParams] = useSearchParams();
  // Search bar states
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [cat, setCat] = useState("");
  const [sub, setSub] = useState("");

  // On mount or param change, set cat/sub/search from query params if present
  useEffect(() => {
    const catParam = searchParams.get("cat") || "";
    const subParam = searchParams.get("sub") || "";
    const qParam = searchParams.get("q") || "";
    const minParam = searchParams.get("min") || "";
    const maxParam = searchParams.get("max") || "";
    const sortParam = searchParams.get("sort") || "";
    const freeParam = searchParams.get("free") || "";
    setCat(catParam);
    setSub(subParam);
    setSearchInput(qParam);
    setAppliedSearch(qParam);
    setFilterMinPrice(minParam);
    setFilterMaxPrice(maxParam);
    setFilterSort(sortParam);
    setFilterFreeShipping(freeParam === "1");
    setAppliedMinPrice(minParam);
    setAppliedMaxPrice(maxParam);
    setAppliedSort(sortParam);
    setAppliedFreeShipping(freeParam === "1");
  }, [searchParams]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);

  // Filter states (not applied until user clicks Apply)
  const [filterMinPrice, setFilterMinPrice] = useState("");
  const [filterMaxPrice, setFilterMaxPrice] = useState("");
  const [filterSort, setFilterSort] = useState("");
  const [filterFreeShipping, setFilterFreeShipping] = useState(false);
  // Applied filter states
  const [appliedMinPrice, setAppliedMinPrice] = useState("");
  const [appliedMaxPrice, setAppliedMaxPrice] = useState("");
  const [appliedSort, setAppliedSort] = useState("");
  const [appliedFreeShipping, setAppliedFreeShipping] = useState(false);

  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, "listings"));
      setItems(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    })();
  }, []);

  let filtered = items.filter(
    item =>
      (appliedSearch === "" || item.name.toLowerCase().includes(appliedSearch.toLowerCase())) &&
      (cat === "" || item.category === cat) &&
      (sub === "" || item.subcategory === sub)
  );

  // Apply additional filters
  if (appliedMinPrice !== "") {
    filtered = filtered.filter(item => Number(item.price) >= Number(appliedMinPrice));
  }
  if (appliedMaxPrice !== "") {
    filtered = filtered.filter(item => Number(item.price) <= Number(appliedMaxPrice));
  }
  if (appliedFreeShipping) {
    filtered = filtered.filter(item => item.freeShipping === true);
  }
  if (appliedSort === "price-asc") {
    filtered = [...filtered].sort((a, b) => Number(a.price) - Number(b.price));
  } else if (appliedSort === "price-desc") {
    filtered = [...filtered].sort((a, b) => Number(b.price) - Number(a.price));
  } else if (appliedSort === "newest") {
    filtered = [...filtered].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }

  return (
    <>
      <Header />
      <div className="w-full min-h-screen bg-white py-10 px-2 md:px-8">
        <div className="flex flex-col md:flex-row gap-10 w-full">
          {/* Sidebar: Category List */}
          <aside className="w-full md:w-80 mb-8 md:mb-0 flex flex-col gap-6">
            {/* Category Filter Card - Improved UI */}
            <div className="bg-white border border-gray-200 rounded-2xl p-0 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="#222" strokeWidth="1.5" d="M4 7h16M6 12h12M8 17h8" strokeLinecap="round" /></svg>
                <h2 className="text-base font-semibold tracking-tight">Categories</h2>
              </div>
              <ul className="flex flex-col gap-1 px-4 py-4">
                {categories.map(c => (
                  <li key={c.name} className="flex flex-col">
                    <div className="flex items-center w-full group">
                      <button
                        className={`flex-1 text-left px-3 py-2 rounded-lg font-medium transition-all duration-150 group-hover:bg-gray-100 group-hover:text-black border border-transparent ${cat === c.name ? "bg-black text-white border-black shadow-sm" : "text-gray-800"}`}
                        onClick={() => {
                          const newCat = c.name === cat ? "" : c.name;
                          setCat(newCat);
                          setSub("");
                          // Update URL, preserve q param
                          const params = new URLSearchParams(searchParams);
                          if (newCat) {
                            params.set("cat", newCat);
                          } else {
                            params.delete("cat");
                            params.delete("sub");
                          }
                          navigate({ pathname: "/search", search: params.toString() });
                        }}
                      >
                        {c.name}
                      </button>
                      <button
                        className="ml-1 p-1 rounded hover:bg-gray-200"
                        aria-label={expanded === c.name ? `Collapse ${c.name}` : `Expand ${c.name}`}
                        onClick={e => {
                          e.stopPropagation();
                          setExpanded(expanded === c.name ? null : c.name);
                        }}
                      >
                        {expanded === c.name ? <FiChevronDown /> : <FiChevronRight />}
                      </button>
                    </div>
                    {expanded === c.name && c.subcategories && (
                      <ul className="pl-4 py-1 flex flex-col gap-1">
                        {c.subcategories.map(sc => (
                          <li key={sc}>
                            <button
                              className={`w-full text-left px-3 py-1.5 rounded-lg transition-all duration-150 text-sm border border-transparent ${sub === sc ? "bg-black text-white border-black shadow-sm" : "text-gray-700 hover:bg-gray-100 hover:text-black"}`}
                              onClick={() => {
                                setCat(c.name);
                                setSub(sc);
                                // Update URL, preserve q param
                                const params = new URLSearchParams(searchParams);
                                params.set("cat", c.name);
                                params.set("sub", sc);
                                navigate({ pathname: "/search", search: params.toString() });
                              }}
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
                    className="w-full px-3 py-2 rounded-lg text-left text-gray-500 hover:bg-gray-100 text-sm border border-gray-200 font-semibold transition disabled:opacity-50"
                    onClick={() => {
                      setCat(""); setSub(""); setExpanded(null);
                      // preserve q param
                      const params = new URLSearchParams(searchParams);
                      params.delete("cat");
                      params.delete("sub");
                      navigate({ pathname: "/search", search: params.toString() });
                    }}
                    disabled={!cat && !sub}
                  >
                    Clear Filters
                  </button>
                </li>
              </ul>
            </div>

            {/* Additional Filters Card - Improved UI */}
            <div className="bg-white border border-gray-200 rounded-2xl p-0 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="#222" strokeWidth="1.5" d="M3 6h18M6 12h12M10 18h4" strokeLinecap="round" /></svg>
                <h2 className="text-base font-semibold tracking-tight">More Filters</h2>
              </div>
              <div className="flex flex-col gap-5 px-4 py-4">
                {/* Price Range */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">Price Range (LKR)</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      min="0"
                      className="w-1/2 px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-black outline-none transition-all text-sm bg-gray-50 focus:bg-white"
                      placeholder="Min"
                      value={filterMinPrice}
                      onChange={e => setFilterMinPrice(e.target.value)}
                    />
                    <span className="text-gray-400 text-xs">—</span>
                    <input
                      type="number"
                      min="0"
                      className="w-1/2 px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-black outline-none transition-all text-sm bg-gray-50 focus:bg-white"
                      placeholder="Max"
                      value={filterMaxPrice}
                      onChange={e => setFilterMaxPrice(e.target.value)}
                    />
                  </div>
                </div>
                <div className="border-t border-gray-100" />
                {/* Sort By */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">Sort By</label>
                  <select
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-black outline-none transition-all text-sm bg-gray-50 focus:bg-white"
                    value={filterSort}
                    onChange={e => setFilterSort(e.target.value)}
                  >
                    <option value="">Default</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="newest">Newest</option>
                  </select>
                </div>
                <div className="border-t border-gray-100" />
                {/* Free Shipping */}
                <div className="flex items-center gap-2">
                  <input
                    id="free-shipping"
                    type="checkbox"
                    checked={filterFreeShipping}
                    onChange={e => setFilterFreeShipping(e.target.checked)}
                    className="accent-black w-4 h-4 rounded"
                  />
                  <label htmlFor="free-shipping" className="text-sm text-gray-700 select-none cursor-pointer">Free Shipping Only</label>
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    className="flex-1 px-4 py-2 rounded-lg bg-black text-white font-semibold hover:bg-gray-800 transition text-sm shadow"
                    onClick={() => {
                      setAppliedMinPrice(filterMinPrice);
                      setAppliedMaxPrice(filterMaxPrice);
                      setAppliedSort(filterSort);
                      setAppliedFreeShipping(filterFreeShipping);
                      // Update URL with more filters
                      const params = new URLSearchParams(searchParams);
                      if (filterMinPrice) params.set("min", filterMinPrice); else params.delete("min");
                      if (filterMaxPrice) params.set("max", filterMaxPrice); else params.delete("max");
                      if (filterSort) params.set("sort", filterSort); else params.delete("sort");
                      if (filterFreeShipping) params.set("free", "1"); else params.delete("free");
                      navigate({ pathname: "/search", search: params.toString() });
                    }}
                  >
                    Apply Filters
                  </button>
                  <button
                    className="flex-1 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition text-sm border border-gray-200"
                    onClick={() => {
                      setFilterMinPrice("");
                      setFilterMaxPrice("");
                      setFilterSort("");
                      setFilterFreeShipping(false);
                      setAppliedMinPrice("");
                      setAppliedMaxPrice("");
                      setAppliedSort("");
                      setAppliedFreeShipping(false);
                      // Remove more filters from URL
                      const params = new URLSearchParams(searchParams);
                      params.delete("min");
                      params.delete("max");
                      params.delete("sort");
                      params.delete("free");
                      navigate({ pathname: "/search", search: params.toString() });
                    }}
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </aside>
          {/* Main Content: Search and Results */}
          <main className="flex-1">
            <div className="mb-8">
              <form
                className="flex w-full gap-0"
                onSubmit={e => {
                  e.preventDefault();
                  // Update URL with search param, preserve cat/sub
                  const params = new URLSearchParams(searchParams);
                  if (searchInput) {
                    params.set("q", searchInput);
                  } else {
                    params.delete("q");
                  }
                  navigate({ pathname: "/search", search: params.toString() });
                }}
              >
                <input
                  className="flex-1 bg-gray-100 bg-white outline-none px-5 py-3 rounded-l-xl font-medium text-lg transition border border-gray-200 border-r-0"
                  placeholder="Search products..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  // Remove onKeyDown handler, not needed
                  aria-label="Search products"
                />
                <button
                  type="submit"
                  className="px-6 py-3 rounded-r-xl bg-black text-white font-semibold text-lg hover:bg-gray-800 transition shadow border border-gray-200"
                  aria-label="Search"
                >
                  Search
                </button>
              </form>
            </div>
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-7">
              {filtered.map(item => (
                <Link
                  key={item.id}
                  to={`/listing/${item.id}`}
                  className="group flex flex-col bg-white border border-gray-200 rounded-2xl shadow-md hover:shadow-xl hover:border-black transition-all p-4 relative cursor-pointer"
                  style={{ textDecoration: 'none' }}
                >
                  {/* Wishlist Icon (top right) */}
                  {/* Product Image */}
                  <div className="w-full aspect-square bg-gray-100 rounded-xl mb-4 flex items-center justify-center overflow-hidden border border-gray-100 group-hover:border-black transition">
                    {item.images && item.images.length > 0 ? (
                      <img
                        src={item.images[0]}
                        alt={item.name}
                        className="object-cover w-full h-full group-hover:scale-105 group-hover:brightness-90 transition-transform"
                      />
                    ) : (
                      <span className="text-4xl text-gray-300">🖼️</span>
                    )}
                  </div>
                  {/* Product Title */}
                  <h3 className="font-extrabold text-lg mb-1 truncate group-hover:text-black">
                    {item.name}
                  </h3>
                  {/* Delivery Badge */}
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
                  </div>

                  {/* Price & Wishlist bottom row */}
                  <div className="flex items-end justify-between mt-auto">
                    <div className="font-bold text-lg text-black group-hover:text-black tracking-tight">
                      LKR {item.price?.toLocaleString()}
                    </div>
                    <div className="ml-2">
                      <WishlistButton productId={item.id} />
                    </div>
                  </div>
                </Link>
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full text-center text-gray-400 text-lg py-20">
                  No products found.
                </div>
              )}
            </div>

          </main>
        </div>
      </div>
    </>
  );
};

export default Search;
