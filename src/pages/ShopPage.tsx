import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useParams, Link } from "react-router-dom";
import { db } from "../utils/firebase";
import { collection, query, where, getDocs, orderBy, limit, startAfter, QueryDocumentSnapshot, type DocumentData } from "firebase/firestore";
import { FiBox } from "react-icons/fi";
import ShopOwnerName from "./ShopOwnerName";
import Header from "../components/UI/Header";
import ShopReviews from "../components/UI/ShopReviews";

type Shop = {
    id: string;
    name: string;
    username: string;
    mobile: string;
    description: string;
    logo?: string;
    cover?: string;
    owner: string;
    rating?: number;
    ratingCount?: number;
};

type Listing = {
    id: string;
    name: string;
    price: number;
    images?: string[];
    description?: string;
};

const PAGE_SIZE = 8;

export default function ShopPage() {
    const { user } = useAuth();
    const { username } = useParams<{ username: string }>();
    const [shop, setShop] = useState<Shop | null>(null);
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [pageCursors, setPageCursors] = useState<Array<QueryDocumentSnapshot<DocumentData> | null>>([null]); // First page starts at null

    // 1. Fetch shop info
    useEffect(() => {
        async function fetchShop() {
            setLoading(true);
            const shopQuery = query(collection(db, "shops"), where("username", "==", username));
            const shopSnap = await getDocs(shopQuery);
            if (shopSnap.empty) {
                setShop(null);
                setLoading(false);
                return;
            }
            const shopData = { ...shopSnap.docs[0].data(), id: shopSnap.docs[0].id } as Shop;
            setShop(shopData);
            setLoading(false);
        }
        if (username) fetchShop();
    }, [username]);

    // 2. Fetch listings count for pagination
    useEffect(() => {
        if (!shop) return;
        async function getTotalCount() {
            // NOTE: For large collections, a Firestore aggregate query is better. Here we fetch all IDs for simplicity.
            const allListingsSnap = await getDocs(query(collection(db, "listings"), where("owner", "==", shop?.owner)));
            setTotalCount(allListingsSnap.size);
        }
        getTotalCount();
    }, [shop]);

    // 3. Fetch paginated listings
    const fetchListings = useCallback(
        async (currentPage: number, cursors: Array<QueryDocumentSnapshot<DocumentData> | null>) => {
            if (!shop) return;
            setLoading(true);

            let q;
            if (currentPage === 1) {
                q = query(
                    collection(db, "listings"),
                    where("owner", "==", shop.owner),
                    limit(PAGE_SIZE)
                );
            } else {
                const cursor = cursors[currentPage - 2]; // previous page's last doc
                if (!cursor) return;
                q = query(
                    collection(db, "listings"),
                    where("owner", "==", shop.owner),
                    startAfter(cursor),
                    limit(PAGE_SIZE)
                );
            }
            const snap = await getDocs(q);
            console.log('ddd', snap.docs);
            const docs = snap.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as Listing[];
            setListings(docs);

            // Set page cursors for navigation (forwards only)
            if (snap.docs.length > 0) {
                const newCursors = [...cursors];
                newCursors[currentPage - 1] = snap.docs[snap.docs.length - 1];
                setPageCursors(newCursors);
            }
            setLoading(false);
        },
        [shop]
    );

    // 4. Fetch listings when shop, page, or pageCursors change
    useEffect(() => {
        if (!shop) return;
        fetchListings(page, pageCursors);
    }, [shop, page]); // eslint-disable-line

    // 5. Generate page numbers
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    // 6. Handle page navigation
    function handlePageChange(newPage: number) {
        setPage(newPage);
        // Cursors are only populated as you go, so if jumping forward by more than 1, refetch from page 1 forward
        // (For full "random access" page jumps, you'd need to store all cursors as you go forward, or load all IDs up front.)
    }

    // 7. Loading and not found states
    if (loading && !shop) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <span className="text-gray-400 text-xl">Loading...</span>
            </div>
        );
    }

    if (!shop) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-gray-500 text-center">
                    <div className="text-2xl font-bold mb-2">Shop Not Found</div>
                    <div>This shop does not exist.</div>
                </div>
            </div>
        );
    }

    // 8. Pagination controls
    function Pagination() {
        if (totalPages <= 1) return null;
        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
            pages.push(
                <button
                    key={i}
                    className={`w-10 h-10 rounded-full mx-1 font-semibold text-base border border-gray-200 hover:bg-black hover:text-white transition
                    ${page === i ? "bg-black text-white border-black" : "bg-white text-black"}`}
                    onClick={() => handlePageChange(i)}
                    disabled={i === page}
                >
                    {i}
                </button>
            );
        }
        return (
            <div className="flex justify-center items-center mt-10">
                <button
                    className="px-4 py-2 mx-1 rounded-full border border-gray-200 hover:bg-gray-100 disabled:opacity-50"
                    onClick={() => page > 1 && handlePageChange(page - 1)}
                    disabled={page === 1}
                >
                    Prev
                </button>
                {pages}
                <button
                    className="px-4 py-2 mx-1 rounded-full border border-gray-200 hover:bg-gray-100 disabled:opacity-50"
                    onClick={() => page < totalPages && handlePageChange(page + 1)}
                    disabled={page === totalPages}
                >
                    Next
                </button>
            </div>
        );
    }

    // 9. Render shop page
    return (
        <>
            <Header />
            <div className="bg-white min-h-screen">
                {/* Cover + Logo */}
                <div className="relative w-full h-44 md:h-60 bg-gray-100 flex items-center justify-center">
                    {shop.cover ? (
                        <img src={shop.cover} alt="Shop Cover" className="object-cover w-full h-full" />
                    ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <FiBox className="text-5xl text-gray-300" />
                        </div>
                    )}
                    <div className="absolute left-1/2 bottom-[-48px] -translate-x-1/2 w-24 h-24 rounded-full border-4 border-white bg-gray-200 shadow-md flex items-center justify-center">
                        {shop.logo ? (
                            <img src={shop.logo} alt="Shop Logo" className="object-cover w-full h-full rounded-full" />
                        ) : (
                            <FiBox className="text-3xl text-gray-400" />
                        )}
                    </div>
                </div>

                {/* Main Info */}
                <div className="w-full flex flex-col items-center mt-16 px-4">
                    <div className="max-w-3xl w-full flex flex-col items-center text-center">
                        <h1 className="text-2xl md:text-3xl font-black mb-1">{shop.name}</h1>
                        <ShopOwnerName ownerId={shop.owner} username={shop.username} />
                        {/* Shop Rating */}
                        {typeof shop.rating === 'number' && typeof shop.ratingCount === 'number' && (
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-xl font-extrabold">{shop.rating.toFixed(1)}</span>
                                <div className="flex items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <svg
                                            key={i}
                                            className={`h-5 w-5 ${shop.rating && shop.rating >= i - 0.25 ? "text-yellow-400" : "text-gray-200"}`}
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.38-2.454a1 1 0 00-1.175 0l-3.38 2.454c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.05 9.394c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.967z" />
                                        </svg>
                                    ))}
                                </div>
                                <button
                                    className="text-gray-500 text-sm font-medium ml-2 underline hover:text-black focus:outline-none"
                                    onClick={() => {
                                        const el = document.getElementById('shop-reviews-section');
                                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    type="button"
                                >
                                    {shop.ratingCount} {shop.ratingCount === 1 ? "review" : "reviews"}
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="max-w-3xl w-full mb-10 flex flex-col items-center">
                        <div className="text-gray-800 text-base md:text-lg whitespace-pre-line min-h-[64px] rounded-xl p-6 text-center">
                            {shop.description}
                        </div>
                    </div>
                </div>

                {/* Listings */}
                <section className="w-full bg-white py-8 border-t border-black">
                    <div className="w-full px-2 sm:px-6">
                        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
                            <h2 className="text-xl md:text-2xl font-bold uppercase tracking-wide">
                                Shop Listings
                            </h2>
                            {user && shop && user.uid === shop.owner && (
                                <a
                                    href="/add-listing"
                                    className="inline-block px-6 py-2 bg-black text-white rounded-full font-semibold uppercase tracking-wide hover:bg-gray-900 transition"
                                >
                                    + Create New Listing
                                </a>
                            )}
                        </div>
                        {listings.length === 0 ? (
                            <div className="text-gray-400 py-8 text-center">No products yet.</div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-7 w-full">
                                    {listings.map((item) => (
                                        <Link
                                            to={`/listing/${item.id}`}
                                            key={item.id}
                                            className="flex flex-col border border-black bg-gray-50 rounded-xl shadow-sm p-6 min-h-[220px] hover:bg-gray-100 transition cursor-pointer"
                                            style={{ textDecoration: 'none', color: 'inherit' }}
                                        >
                                            <div className="w-full h-32 bg-gray-200 mb-4 rounded overflow-hidden flex items-center justify-center">
                                                {item.images && item.images.length > 0 ? (
                                                    <img
                                                        src={item.images[0]}
                                                        alt={item.name}
                                                        className="object-cover w-full h-full"
                                                    />
                                                ) : (
                                                    <FiBox className="text-3xl text-gray-400" />
                                                )}
                                            </div>
                                            <h3 className="font-semibold text-lg mb-2 truncate">{item.name}</h3>
                                            <p className="text-sm font-light mb-2 text-gray-700 line-clamp-2">
                                                {item.description}
                                            </p>
                                            <span className="font-bold text-black mt-auto">
                                                Rs. {item.price?.toLocaleString("en-LK") || "0.00"}
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                                <Pagination />
                            </>
                        )}
                    </div>
                </section>
            </div>

            {/* Shop Reviews Section */}
            <div className="w-full" id="shop-reviews-section">
                {shop.id && (
                    <div className="border-t border-gray-200 mt-12 pt-10 px-0">
                        <ShopReviews shopId={shop.id} />
                    </div>
                )}
            </div>
        </>
    );
}
