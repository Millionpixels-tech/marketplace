import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../utils/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { FiBox } from "react-icons/fi";
import ShopOwnerName from "./ShopOwnerName";
import Header from "../components/UI/Header";

type Shop = {
    id: string;
    name: string;
    username: string;
    mobile: string;
    description: string;
    logo?: string;
    cover?: string;
    owner: string; // User ID of the shop owner
};

type Listing = {
    id: string;
    name: string;
    price: number;
    images?: string[];
    description?: string;
};

export default function ShopPage() {
    const { username } = useParams<{ username: string }>();
    const [shop, setShop] = useState<Shop | null>(null);
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchShop() {
            setLoading(true);
            // 1. Find the shop by username
            const shopQuery = query(collection(db, "shops"), where("username", "==", username));
            const shopSnap = await getDocs(shopQuery);
            if (shopSnap.empty) {
                setShop(null);
                setLoading(false);
                return;
            }
            const shopData = { ...shopSnap.docs[0].data(), id: shopSnap.docs[0].id } as Shop;
            setShop(shopData);

            // 2. Fetch listings for this shop (by owner)
            const listingsQuery = query(collection(db, "listings"), where("owner", "==", shopData ? shopData.owner : ""));
            const listingsSnap = await getDocs(listingsQuery);
            const listingsData: Listing[] = listingsSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as Listing[];
            setListings(listingsData);
            setLoading(false);
        }

        if (username) fetchShop();
    }, [username]);

    if (loading) {
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
                            <a
                                href="/add-listing" // or use <Link to="/add-listing"> if using react-router
                                className="inline-block px-6 py-2 bg-black text-white rounded-full font-semibold uppercase tracking-wide hover:bg-gray-900 transition"
                            >
                                + Create New Listing
                            </a>
                        </div>
                        {listings.length === 0 ? (
                            <div className="text-gray-400 py-8 text-center">No products yet.</div>
                        ) : (
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
                        )}
                    </div>
                </section>

            </div></>
    );
}
