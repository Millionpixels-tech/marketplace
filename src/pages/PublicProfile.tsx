import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../utils/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import Header from "../components/UI/Header";

export default function PublicProfile() {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [shops, setShops] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const userQuery = query(collection(db, "users"), where("uid", "==", id));
            const userSnap = await getDocs(userQuery);
            if (!userSnap.empty) {
                setUserProfile(userSnap.docs[0].data());
            } else {
                setUserProfile(null);
            }
            const shopsQuery = query(collection(db, "shops"), where("owner", "==", id));
            const shopsSnap = await getDocs(shopsQuery);
            setShops(shopsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        };
        fetchData();
    }, [id]);

    if (loading)
        return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;
    if (!userProfile)
        return <div className="min-h-screen flex items-center justify-center text-gray-400">User not found.</div>;

    return (
        <div className="bg-gray-50 min-h-screen w-full">
            <Header />
            <div className="max-w-2xl mx-auto py-10 px-4">
                <div className="flex flex-col items-center bg-white rounded-3xl shadow-lg p-8 mb-8 w-full">
                    <div className="w-28 h-28 rounded-full bg-gray-200 border-4 border-white shadow flex items-center justify-center overflow-hidden mb-4">
                        {userProfile.photoURL ? (
                            <img src={userProfile.photoURL} alt="Profile" className="object-cover w-full h-full" />
                        ) : (
                            <span className="text-4xl text-gray-500 font-bold">
                                {userProfile.displayName ? userProfile.displayName[0] : userProfile.email ? userProfile.email[0] : ''}
                            </span>
                        )}
                    </div>
                    <div className="text-2xl font-black mb-2 text-center">
                        {userProfile.displayName || userProfile.email}
                    </div>
                    <div className="text-gray-700 text-lg min-h-[48px] whitespace-pre-line text-center mb-8">
                        {userProfile.description || <span className="text-gray-400">No description yet.</span>}
                    </div>

                    {/* Shops Section INSIDE card */}
                    <div className="w-full">
                        <h2 className="text-xl font-bold mb-4 text-center">Shops Managed</h2>
                        {shops.length === 0 ? (
                            <div className="text-gray-400 text-center">No shops found.</div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {shops.map(shop => (
                                    <Link
                                        key={shop.id}
                                        to={`/shop/${shop.username}`}
                                        className="border border-gray-200 rounded-xl p-4 bg-gray-50 hover:bg-gray-100 transition flex items-center gap-4"
                                    >
                                        {shop.logo ? (
                                            <img src={shop.logo} alt={shop.name} className="w-14 h-14 rounded-full object-cover border border-gray-200" />
                                        ) : (
                                            <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-2xl text-gray-400 font-bold">{shop.name[0]}</div>
                                        )}
                                        <div>
                                            <div className="font-bold text-lg">{shop.name}</div>
                                            <div className="text-xs text-gray-500">@{shop.username}</div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
