import { useEffect, useState } from "react";
import { db } from "../utils/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { FiSearch } from "react-icons/fi";
import { categories } from "../utils/categories";
import Header from "../components/UI/Header";

function ProductHeroSearch() {
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: any) => {
    e.preventDefault();
    if (q.trim()) {
      navigate(`/search?q=${encodeURIComponent(q)}`);
    }
  };

  return (
    <form
      onSubmit={handleSearch}
      className="w-full max-w-md mx-auto flex items-center bg-white rounded-full shadow-lg px-3 py-2 mb-6 border border-black/10 focus-within:border-black transition"
      style={{ boxShadow: "0 2px 20px 0 rgba(24,41,73,.06)" }}
    >
      <FiSearch className="text-2xl text-gray-400 mr-2" />
      <input
        className="flex-1 bg-transparent outline-none border-none text-lg px-2 py-1"
        type="text"
        placeholder="Search for products…"
        value={q}
        onChange={e => setQ(e.target.value)}
        aria-label="Search for products"
      />
      <button
        type="submit"
        className="ml-2 px-6 py-2 rounded-full bg-black text-white font-semibold uppercase hover:bg-gray-900 transition text-sm"
      >
        Search
      </button>
    </form>
  );
}

type Listing = {
  id: string;
  name?: string;
  price?: number;
  images?: string[];
  description?: string;
  createdAt?: any;
};

const Home = () => {
  const [latestListings, setLatestListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLatest() {
      setLoading(true);
      const q = query(collection(db, "listings"), orderBy("createdAt", "desc"), limit(10));
      const snap = await getDocs(q);
      const results: Listing[] = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLatestListings(results);
      setLoading(false);
    }
    fetchLatest();
  }, []);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-white text-black flex flex-col">
        {/* Header Hero */}
        <header className="flex-1 flex flex-col justify-center items-center text-center py-24 bg-[#f4faff]">
          <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tight uppercase">
            Sri Lankan Homemade Marketplace
          </h1>
          <p className="text-lg md:text-2xl max-w-2xl mx-auto mb-8 font-light">
            Discover, buy, and support unique homemade creations from small Sri Lankan businesses.
            A new way to shop local, from anywhere in Sri Lanka.
          </p>
          {/* Product Search Bar */}
          <ProductHeroSearch />
          <div className="flex gap-4 justify-center mt-8">
            <Link
              to="/search"
              className="border border-black px-8 py-3 rounded-full hover:bg-black hover:text-white transition font-semibold tracking-wide uppercase"
            >
              Browse Products
            </Link>
            <Link
              to="/create-shop"
              className="border border-black px-8 py-3 rounded-full hover:bg-black hover:text-white transition font-semibold tracking-wide uppercase"
            >
              Open Your Shop
            </Link>
          </div>
        </header>

        {/* Categories */}
        <section className="py-16 border-t border-black w-full">
          <h2 className="text-2xl font-bold text-center mb-8 uppercase tracking-wide">
            Featured Categories
          </h2>
          <div className="flex flex-wrap justify-center gap-6">
            {categories.map((cat) => (
              <Link
                to={`/search?cat=${encodeURIComponent(cat.name)}`}
                key={cat.name}
                className="border border-black px-8 py-6 rounded-lg min-w-[200px] text-center text-lg font-medium uppercase hover:bg-black hover:text-white transition"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-16 border-t border-black w-full bg-white">
          <div className="flex flex-col sm:flex-row items-center justify-between w-full mb-8 px-4 sm:px-12">
            <h2 className="text-2xl font-bold uppercase tracking-wide">
              Latest Listings
            </h2>
            <Link
              to="/search"
              className="text-sm border-b-2 border-black hover:text-gray-700 font-semibold uppercase transition mt-4 sm:mt-0"
            >
              See All Products
            </Link>
          </div>
          <div className="w-full px-2 sm:px-6">
            {loading ? (
              <div className="text-center text-gray-400 py-12">Loading latest products…</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 w-full">
                {latestListings.map(item => (
                  <Link
                    to={`/listing/${item.id}`}
                    key={item.id}
                    className="flex flex-col items-start border border-black bg-gray-100 rounded-lg shadow-sm p-6 min-h-[220px] justify-between hover:bg-gray-200 transition"
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <div className="w-full h-32 bg-gray-200 mb-4 rounded flex items-center justify-center overflow-hidden">
                      {item.images && item.images.length > 0 ? (
                        <img
                          src={item.images[0]}
                          alt={item.name}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="text-gray-400 text-3xl">No Image</div>
                      )}
                    </div>
                    <h3 className="font-semibold text-lg mb-2 truncate">{item.name}</h3>
                    <p className="text-sm font-light mb-2 text-gray-700 line-clamp-2">{item.description}</p>
                    <span className="font-bold text-black">Rs. {item.price?.toLocaleString("en-LK") || "0.00"}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* How it Works */}
        <section className="py-16 w-full border-t border-black bg-white">
          <h2 className="text-2xl font-bold text-center mb-12 uppercase tracking-wide">
            How It Works
          </h2>
          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-10">
            <div className="border border-black rounded-lg p-8 text-center">
              <div className="text-4xl font-black mb-3">1</div>
              <h3 className="font-bold mb-2 uppercase">Create Account</h3>
              <p className="text-sm font-light">Sign up with email or Google. Shop or start selling in minutes.</p>
            </div>
            <div className="border border-black rounded-lg p-8 text-center">
              <div className="text-4xl font-black mb-3">2</div>
              <h3 className="font-bold mb-2 uppercase">Browse & Discover</h3>
              <p className="text-sm font-light">Explore unique homemade items by category, shop, or keyword.</p>
            </div>
            <div className="border border-black rounded-lg p-8 text-center">
              <div className="text-4xl font-black mb-3">3</div>
              <h3 className="font-bold mb-2 uppercase">Support Locals</h3>
              <p className="text-sm font-light">Buy directly from Sri Lankan creators. Safe and simple checkout.</p>
            </div>
          </div>
        </section>

        {/* Mission or Call to Action */}
        <footer className="w-full py-12 border-t border-black bg-white text-center">
          <h3 className="text-xl font-bold mb-2 uppercase">For Sri Lanka, By Sri Lankans</h3>
          <p className="text-md font-light max-w-xl mx-auto mb-4">
            Every purchase helps a small Sri Lankan business grow.
            Start shopping or open your own shop today.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/search"
              className="border border-black px-6 py-2 rounded-full hover:bg-black hover:text-white transition uppercase font-semibold"
            >
              Start Shopping
            </Link>
            <Link
              to="/create-shop"
              className="border border-black px-6 py-2 rounded-full hover:bg-black hover:text-white transition uppercase font-semibold"
            >
              Become a Seller
            </Link>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Home;
