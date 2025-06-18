import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../../utils/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import Header from "../../components/UI/Header";
import Footer from "../../components/UI/Footer";
import ContactSellerButton from "../../components/UI/ContactSellerButton";

export default function PublicProfile() {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [shops, setShops] = useState<any[]>([]);


    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            setLoading(true);
            try {
                // Batch both queries for better performance
                const [userSnap, shopsSnap] = await Promise.all([
                    getDocs(query(collection(db, "users"), where("uid", "==", id))),
                    getDocs(query(collection(db, "shops"), where("owner", "==", id)))
                ]);

                if (!userSnap.empty) {
                    setUserProfile(userSnap.docs[0].data());
                } else {
                    setUserProfile(null);
                }
                
                setShops(shopsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (error) {
                console.error("Error fetching profile data:", error);
                setUserProfile(null);
                setShops([]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (loading)
        return <div className="min-h-screen flex items-center justify-center" style={{ color: '#454955', backgroundColor: '#ffffff' }}>Loading...</div>;
    if (!userProfile)
        return <div className="min-h-screen flex items-center justify-center" style={{ color: '#454955', backgroundColor: '#ffffff' }}>User not found.</div>;

    return (
        <div className="min-h-screen w-full" style={{ backgroundColor: '#ffffff' }}>
            <Header />
            <div className="max-w-2xl mx-auto py-10 px-4">
                <div className="flex flex-col items-center rounded-3xl shadow-lg p-8 mb-8 w-full border" style={{ backgroundColor: '#ffffff', borderColor: 'rgba(114, 176, 29, 0.3)' }}>
                    <div className="w-28 h-28 rounded-full border-4 shadow flex items-center justify-center overflow-hidden mb-4" style={{ backgroundColor: '#ffffff', borderColor: 'rgba(114, 176, 29, 0.6)' }}>
                        {userProfile.photoURL ? (
                            <img src={userProfile.photoURL} alt="Profile" className="object-cover w-full h-full" />
                        ) : (
                            <span className="text-4xl font-bold" style={{ color: '#0d0a0b' }}>
                                {userProfile.displayName ? userProfile.displayName[0] : userProfile.email ? userProfile.email[0] : ''}
                            </span>
                        )}
                    </div>
                    <div className="text-2xl font-black mb-2 text-center flex items-center justify-center gap-2" style={{ color: '#0d0a0b' }}>
                        <span>{userProfile.displayName || userProfile.email}</span>
                        {userProfile.verification?.isVerified === 'COMPLETED' && (
                            <span className="inline-flex items-center justify-center rounded-full w-6 h-6" style={{ backgroundColor: '#72b01d' }}>
                                <svg viewBox="0 0 20 20" fill="#ffffff" className="w-4 h-4">
                                    <path fillRule="evenodd" d="M16.707 6.293a1 1 0 00-1.414 0L9 12.586 6.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l7-7a1 1 0 000-1.414z" clipRule="evenodd" />
                                </svg>
                            </span>
                        )}
                    </div>
                    <div className="text-lg min-h-[48px] whitespace-pre-line text-center mb-8" style={{ color: '#454955' }}>
                        {userProfile.description || <span style={{ color: '#454955', opacity: 0.7 }}>No description yet.</span>}
                    </div>

                    {/* Contact User Button */}
                    <div className="mb-8">
                        <ContactSellerButton
                            sellerId={userProfile.uid}
                            sellerName={userProfile.displayName || userProfile.email}
                            context={{
                                type: 'user',
                                id: userProfile.uid,
                                title: `${userProfile.displayName || userProfile.email}'s Profile`
                            }}
                            buttonText="Contact User"
                            buttonStyle="primary"
                            size="md"
                        />
                    </div>

                    {/* Shops Section INSIDE card */}
                    <div className="w-full">
                        <h2 className="text-xl font-bold mb-4 text-center" style={{ color: '#0d0a0b' }}>Shops Managed</h2>
                        {shops.length === 0 ? (
                            <div className="text-center" style={{ color: '#454955', opacity: 0.7 }}>No shops found.</div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {shops.map(shop => (
                                    <Link
                                        key={shop.id}
                                        to={`/shop/${shop.username}`}
                                        className="border rounded-xl p-4 transition flex items-center gap-4"
                                        style={{
                                            borderColor: 'rgba(114, 176, 29, 0.3)',
                                            backgroundColor: '#ffffff'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = '#f8f9fa';
                                            e.currentTarget.style.borderColor = 'rgba(114, 176, 29, 0.6)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = '#ffffff';
                                            e.currentTarget.style.borderColor = 'rgba(114, 176, 29, 0.3)';
                                        }}
                                    >
                                        {shop.logo ? (
                                            <img src={shop.logo} alt={shop.name} className="w-14 h-14 rounded-full object-cover border" style={{ borderColor: 'rgba(114, 176, 29, 0.4)' }} />
                                        ) : (
                                            <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold border" style={{ backgroundColor: '#ffffff', color: '#72b01d', borderColor: 'rgba(114, 176, 29, 0.4)' }}>{shop.name[0]}</div>
                                        )}
                                        <div>
                                            <div className="font-bold text-lg" style={{ color: '#0d0a0b' }}>{shop.name}</div>
                                            <div className="text-xs" style={{ color: '#454955' }}>@{shop.username}</div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}
