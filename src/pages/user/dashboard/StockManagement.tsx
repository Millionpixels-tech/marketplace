import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { db } from "../../../utils/firebase";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { FiEdit, FiSave, FiX, FiPackage, FiAlertTriangle, FiShoppingBag } from "react-icons/fi";
import { useResponsive } from "../../../hooks/useResponsive";

interface Variation {
    id: string;
    name: string;
    priceChange: number;
    quantity: number;
}

interface Listing {
    id: string;
    name: string;
    price: number;
    quantity: number;
    hasVariations: boolean;
    variations?: Variation[];
    shopName?: string;
    imageUrl?: string;
    status: string;
}

interface StockManagementProps {
    profileUid: string | null;
}

export default function StockManagement({ profileUid }: StockManagementProps) {
    const { isMobile } = useResponsive();
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasShops, setHasShops] = useState(true);
    const [editingItems, setEditingItems] = useState<Set<string>>(new Set());
    const [tempQuantities, setTempQuantities] = useState<Record<string, number>>({});
    const [tempVariationQuantities, setTempVariationQuantities] = useState<Record<string, number>>({});
    const [saving, setSaving] = useState<Set<string>>(new Set());
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (profileUid) {
            fetchListings();
        }
    }, [profileUid]);

    // Helper function to truncate product name
    const truncateProductName = (name: string, maxLength: number = 35) => {
        if (name.length <= maxLength) return name;
        return name.substring(0, maxLength) + '...';
    };

    const fetchListings = async () => {
        if (!profileUid) return;
        
        setLoading(true);
        setError(null);
        
        try {
            // Get all listings owned by the user directly
            const listingsQuery = query(
                collection(db, "listings"),
                where("owner", "==", profileUid)
            );
            const listingsSnapshot = await getDocs(listingsQuery);
            
            // Get shop names for display (optional, for better UX)
            const shopIds = [...new Set(listingsSnapshot.docs.map(doc => doc.data().shopId))];
            let shopNames: Record<string, string> = {};
            
            if (shopIds.length > 0) {
                const shopsQuery = query(
                    collection(db, "shops"),
                    where("__name__", "in", shopIds)
                );
                const shopsSnapshot = await getDocs(shopsQuery);
                shopNames = shopsSnapshot.docs.reduce((acc, doc) => {
                    acc[doc.id] = doc.data().name;
                    return acc;
                }, {} as Record<string, string>);
            }
            
            const listingsData = listingsSnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    name: data.name,
                    price: data.price,
                    quantity: data.quantity || 0,
                    hasVariations: data.hasVariations || false,
                    variations: data.variations || [],
                    shopName: shopNames[data.shopId] || 'Unknown Shop',
                    imageUrl: data.images?.[0],
                    status: data.status || 'active'
                };
            });

            setListings(listingsData);
            setHasShops(listingsData.length > 0); // If user has listings, they have shops
        } catch (error) {
            console.error("Error fetching listings:", error);
            setError("Failed to load listings. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const startEditing = (listingId: string, isVariation = false, variationId?: string) => {
        const key = isVariation ? `${listingId}-${variationId}` : listingId;
        setEditingItems(prev => new Set([...prev, key]));
        
        if (isVariation && variationId) {
            const listing = listings.find(l => l.id === listingId);
            const variation = listing?.variations?.find(v => v.id === variationId);
            if (variation) {
                setTempVariationQuantities(prev => ({ 
                    ...prev, 
                    [`${listingId}-${variationId}`]: variation.quantity 
                }));
            }
        } else {
            const listing = listings.find(l => l.id === listingId);
            if (listing) {
                setTempQuantities(prev => ({ ...prev, [listingId]: listing.quantity }));
            }
        }
    };

    const cancelEditing = (listingId: string, isVariation = false, variationId?: string) => {
        const key = isVariation ? `${listingId}-${variationId}` : listingId;
        setEditingItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(key);
            return newSet;
        });
        
        if (isVariation && variationId) {
            setTempVariationQuantities(prev => {
                const newTemp = { ...prev };
                delete newTemp[`${listingId}-${variationId}`];
                return newTemp;
            });
        } else {
            setTempQuantities(prev => {
                const newTemp = { ...prev };
                delete newTemp[listingId];
                return newTemp;
            });
        }
    };

    const saveQuantity = async (listingId: string, isVariation = false, variationId?: string) => {
        const key = isVariation ? `${listingId}-${variationId}` : listingId;
        setSaving(prev => new Set([...prev, key]));
        
        try {
            const listingRef = doc(db, "listings", listingId);
            
            if (isVariation && variationId) {
                const newQuantity = tempVariationQuantities[`${listingId}-${variationId}`];
                const listing = listings.find(l => l.id === listingId);
                if (listing && listing.variations) {
                    const updatedVariations = listing.variations.map(v => 
                        v.id === variationId ? { ...v, quantity: newQuantity } : v
                    );
                    
                    // Calculate total quantity from all variations
                    const totalQuantity = updatedVariations.reduce((sum, v) => sum + v.quantity, 0);
                    
                    await updateDoc(listingRef, { 
                        variations: updatedVariations,
                        quantity: totalQuantity
                    });
                    
                    // Update local state
                    setListings(prev => prev.map(l => 
                        l.id === listingId 
                            ? { ...l, variations: updatedVariations, quantity: totalQuantity }
                            : l
                    ));
                }
            } else {
                const newQuantity = tempQuantities[listingId];
                await updateDoc(listingRef, { quantity: newQuantity });
                
                // Update local state
                setListings(prev => prev.map(l => 
                    l.id === listingId ? { ...l, quantity: newQuantity } : l
                ));
            }
            
            // Clean up editing state
            cancelEditing(listingId, isVariation, variationId);
        } catch (error) {
            console.error("Error updating quantity:", error);
            setError("Failed to update quantity. Please try again.");
        } finally {
            setSaving(prev => {
                const newSet = new Set(prev);
                newSet.delete(key);
                return newSet;
            });
        }
    };

    const getTotalStock = () => {
        return listings.reduce((total, listing) => {
            if (listing.hasVariations && listing.variations) {
                return total + listing.variations.reduce((sum, v) => sum + v.quantity, 0);
            }
            return total + listing.quantity;
        }, 0);
    };

    const getLowStockCount = () => {
        let lowStockCount = 0;
        listings.forEach(listing => {
            if (listing.hasVariations && listing.variations) {
                listing.variations.forEach(variation => {
                    if (variation.quantity <= 5) lowStockCount++;
                });
            } else if (listing.quantity <= 5) {
                lowStockCount++;
            }
        });
        return lowStockCount;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#72b01d]"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                    <FiAlertTriangle className="text-yellow-600 mr-2" />
                    <span className="text-yellow-800">{error}</span>
                </div>
                <button 
                    onClick={fetchListings}
                    className="mt-2 text-sm text-yellow-700 hover:text-yellow-900 underline"
                >
                    Try again
                </button>
            </div>
        );
    }

    return (
        <div>
            <h2 className={`font-bold mb-6 ${isMobile ? 'text-lg' : 'text-xl'}`} style={{ color: '#0d0a0b' }}>
                Stock Management
            </h2>

            {/* Summary Cards */}
            {listings.length > 0 && (
                <div className={`grid gap-4 mb-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
                    <div className="bg-[#72b01d]/10 border border-[#72b01d]/20 rounded-lg p-4">
                        <div className="flex items-center">
                            <FiPackage className="text-[#72b01d] text-xl mr-3" />
                            <div>
                                <div className="text-2xl font-bold text-[#72b01d]">{getTotalStock()}</div>
                                <div className="text-sm text-gray-600">Total Stock</div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center">
                            <FiPackage className="text-gray-600 text-xl mr-3" />
                            <div>
                                <div className="text-2xl font-bold text-gray-900">{listings.length}</div>
                                <div className="text-sm text-gray-600">Total Products</div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center">
                            <FiAlertTriangle className="text-orange-500 text-xl mr-3" />
                            <div>
                                <div className="text-2xl font-bold text-orange-600">{getLowStockCount()}</div>
                                <div className="text-sm text-gray-600">Low Stock (≤5)</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {listings.length === 0 ? (
                <div className="text-center py-12">
                    {!hasShops ? (
                        // No shops created yet
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8">
                            <FiShoppingBag className="text-gray-400 text-5xl mb-4 mx-auto" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Create Your First Shop</h3>
                            <p className="text-gray-600 mb-4">
                                To start managing stock, you need to create a shop first.
                            </p>
                            <Link 
                                to="/create-shop"
                                className="inline-flex items-center px-4 py-2 bg-[#72b01d] text-white text-sm font-medium rounded-lg hover:bg-[#5d8f18] transition-colors"
                            >
                                <FiShoppingBag className="mr-2 h-4 w-4" />
                                Create Shop
                            </Link>
                        </div>
                    ) : (
                        // Has shops but no listings
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8">
                            <FiPackage className="text-gray-400 text-5xl mb-4 mx-auto" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Add Your First Product</h3>
                            <p className="text-gray-600 mb-4">
                                Your shop is ready! Start adding products to begin managing your inventory.
                            </p>
                            <Link 
                                to="/add-listing"
                                className="inline-flex items-center px-4 py-2 bg-[#72b01d] text-white text-sm font-medium rounded-lg hover:bg-[#5d8f18] transition-colors"
                            >
                                <FiPackage className="mr-2 h-4 w-4" />
                                Add Product
                            </Link>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    {isMobile ? (
                        /* Mobile Card Layout */
                        <div className="divide-y divide-gray-200">
                            {listings.map(listing => (
                                <div key={listing.id} className="p-4 space-y-3">
                                    <div className="flex items-start space-x-3">
                                        {listing.imageUrl && (
                                            <img 
                                                src={listing.imageUrl} 
                                                alt={listing.name}
                                                className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
                                            />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-medium text-gray-900" title={listing.name}>
                                                {truncateProductName(listing.name)}
                                            </h3>
                                            <p className="text-xs text-gray-500">{listing.shopName}</p>
                                            <p className="text-sm font-semibold text-gray-900">
                                                Rs.{listing.price.toFixed(2)}
                                            </p>
                                        </div>
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                            listing.status === 'active' 
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {listing.status}
                                        </span>
                                    </div>
                                    
                                    {/* Stock Management */}
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <h4 className="text-xs font-medium text-gray-700 mb-2">Stock Management</h4>
                                        {!listing.hasVariations ? (
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600">Total Stock:</span>
                                                {editingItems.has(listing.id) ? (
                                                    <div className="flex items-center space-x-2">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={tempQuantities[listing.id] || 0}
                                                            onChange={(e) => setTempQuantities(prev => ({
                                                                ...prev,
                                                                [listing.id]: parseInt(e.target.value) || 0
                                                            }))}
                                                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#72b01d] focus:border-[#72b01d]"
                                                        />
                                                        <button
                                                            onClick={() => saveQuantity(listing.id)}
                                                            disabled={saving.has(listing.id)}
                                                            className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50"
                                                        >
                                                            {saving.has(listing.id) ? (
                                                                <div className="animate-spin h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full"></div>
                                                            ) : (
                                                                <FiSave className="h-4 w-4" />
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={() => cancelEditing(listing.id)}
                                                            className="p-1 text-gray-400 hover:text-gray-600"
                                                        >
                                                            <FiX className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => startEditing(listing.id)}
                                                        className="flex items-center text-sm text-[#72b01d] hover:text-[#5d8f18]"
                                                    >
                                                        <span className={`font-medium mr-2 ${
                                                            listing.quantity <= 5 
                                                                ? 'text-orange-600' 
                                                                : listing.quantity === 0 
                                                                    ? 'text-red-600' 
                                                                    : 'text-gray-900'
                                                        }`}>
                                                            {listing.quantity} units
                                                        </span>
                                                        {listing.quantity <= 5 && (
                                                            <FiAlertTriangle className="h-4 w-4 text-orange-500 mr-1" />
                                                        )}
                                                        <FiEdit className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {listing.variations?.map(variation => (
                                                    <div key={variation.id} className="flex items-center justify-between bg-white rounded px-2 py-1.5">
                                                        <div className="flex-1">
                                                            <span className="text-xs font-medium text-gray-700">{variation.name}</span>
                                                            <div className="text-xs text-gray-500">
                                                                Rs.{(listing.price + variation.priceChange).toFixed(2)}
                                                            </div>
                                                        </div>
                                                        {editingItems.has(`${listing.id}-${variation.id}`) ? (
                                                            <div className="flex items-center space-x-1">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    value={tempVariationQuantities[`${listing.id}-${variation.id}`] || 0}
                                                                    onChange={(e) => setTempVariationQuantities(prev => ({
                                                                        ...prev,
                                                                        [`${listing.id}-${variation.id}`]: parseInt(e.target.value) || 0
                                                                    }))}
                                                                    className="w-16 px-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#72b01d]"
                                                                />
                                                                <button
                                                                    onClick={() => saveQuantity(listing.id, true, variation.id)}
                                                                    disabled={saving.has(`${listing.id}-${variation.id}`)}
                                                                    className="p-0.5 text-green-600 hover:text-green-800"
                                                                >
                                                                    {saving.has(`${listing.id}-${variation.id}`) ? (
                                                                        <div className="animate-spin h-3 w-3 border border-green-600 border-t-transparent rounded-full"></div>
                                                                    ) : (
                                                                        <FiSave className="h-3 w-3" />
                                                                    )}
                                                                </button>
                                                                <button
                                                                    onClick={() => cancelEditing(listing.id, true, variation.id)}
                                                                    className="p-0.5 text-gray-400 hover:text-gray-600"
                                                                >
                                                                    <FiX className="h-3 w-3" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => startEditing(listing.id, true, variation.id)}
                                                                className="flex items-center text-xs"
                                                            >
                                                                <span className={`font-medium mr-1 ${
                                                                    variation.quantity <= 5 
                                                                        ? 'text-orange-600' 
                                                                        : variation.quantity === 0 
                                                                            ? 'text-red-600' 
                                                                            : 'text-gray-900'
                                                                }`}>
                                                                    {variation.quantity}
                                                                </span>
                                                                {variation.quantity <= 5 && (
                                                                    <FiAlertTriangle className="h-3 w-3 text-orange-500 mr-1" />
                                                                )}
                                                                <FiEdit className="h-3 w-3 text-gray-400" />
                                                            </button>
                                                        )}
                                                    </div>
                                                )) || []}
                                                <div className="text-xs text-gray-500 text-center pt-1 border-t">
                                                    Total: {listing.quantity} units
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* Desktop Table Layout */
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                                        Product
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">
                                        Shop
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                                        Price
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-5/12">
                                        Stock
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {listings.map(listing => (
                                    <React.Fragment key={listing.id}>
                                        {/* Main Product Row */}
                                        <tr className="hover:bg-gray-50 border-b border-gray-100">
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    {listing.imageUrl && (
                                                        <img 
                                                            src={listing.imageUrl} 
                                                            alt={listing.name}
                                                            className="h-6 w-6 rounded object-cover mr-2 flex-shrink-0"
                                                        />
                                                    )}
                                                    <div className="min-w-0 flex-1">
                                                        <div className="text-xs font-medium text-gray-900" title={listing.name}>
                                                            {truncateProductName(listing.name)}
                                                        </div>
                                                        {listing.hasVariations && (
                                                            <div className="text-xs text-gray-500">
                                                                {listing.variations?.length || 0} variations
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-900 truncate" title={listing.shopName}>
                                                {listing.shopName}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                                Rs.{listing.price.toFixed(2)}
                                                {listing.hasVariations && listing.variations && listing.variations.length > 0 && (
                                                    <div className="text-xs text-gray-500">
                                                        Base price
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                {!listing.hasVariations ? (
                                                    <div className="flex items-center">
                                                        {editingItems.has(listing.id) ? (
                                                            <div className="flex items-center space-x-2">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    value={tempQuantities[listing.id] || 0}
                                                                    onChange={(e) => setTempQuantities(prev => ({
                                                                        ...prev,
                                                                        [listing.id]: parseInt(e.target.value) || 0
                                                                    }))}
                                                                    className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#72b01d] focus:border-[#72b01d]"
                                                                />
                                                                <button
                                                                    onClick={() => saveQuantity(listing.id)}
                                                                    disabled={saving.has(listing.id)}
                                                                    className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50"
                                                                >
                                                                    {saving.has(listing.id) ? (
                                                                        <div className="animate-spin h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full"></div>
                                                                    ) : (
                                                                        <FiSave className="h-4 w-4" />
                                                                    )}
                                                                </button>
                                                                <button
                                                                    onClick={() => cancelEditing(listing.id)}
                                                                    className="p-1 text-gray-400 hover:text-gray-600"
                                                                >
                                                                    <FiX className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center">
                                                                <span className={`text-sm font-medium ${
                                                                    listing.quantity <= 5 
                                                                        ? 'text-orange-600' 
                                                                        : listing.quantity === 0 
                                                                            ? 'text-red-600' 
                                                                            : 'text-gray-900'
                                                                }`}>
                                                                    {listing.quantity} units
                                                                </span>
                                                                {listing.quantity <= 5 && (
                                                                    <FiAlertTriangle className="ml-1 h-4 w-4 text-orange-500" />
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="text-sm font-medium text-gray-900">
                                                        Total: {listing.quantity} units
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    listing.status === 'active' 
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {listing.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                                {!listing.hasVariations && !editingItems.has(listing.id) && (
                                                    <button
                                                        onClick={() => startEditing(listing.id)}
                                                        className="text-[#72b01d] hover:text-[#5d8f18] flex items-center"
                                                    >
                                                        <FiEdit className="h-4 w-4 mr-1" />
                                                        Edit Stock
                                                    </button>
                                                )}
                                            </td>
                                        </tr>

                                        {/* Variation Sub-rows */}
                                        {listing.hasVariations && listing.variations?.map((variation) => (
                                            <tr key={`${listing.id}-${variation.id}`} className="bg-gray-50/50 hover:bg-gray-100">
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="flex items-center pl-8">
                                                        <div className="text-xs text-gray-600">
                                                            ↳ {variation.name}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {/* Empty for variations */}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                    Rs.{(listing.price + variation.priceChange).toFixed(2)}
                                                    {variation.priceChange > 0 && (
                                                        <div className="text-xs text-green-600">
                                                            +Rs.{variation.priceChange.toFixed(2)}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {editingItems.has(`${listing.id}-${variation.id}`) ? (
                                                        <div className="flex items-center space-x-2">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={tempVariationQuantities[`${listing.id}-${variation.id}`] || 0}
                                                                onChange={(e) => setTempVariationQuantities(prev => ({
                                                                    ...prev,
                                                                    [`${listing.id}-${variation.id}`]: parseInt(e.target.value) || 0
                                                                }))}
                                                                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#72b01d] focus:border-[#72b01d]"
                                                            />
                                                            <button
                                                                onClick={() => saveQuantity(listing.id, true, variation.id)}
                                                                disabled={saving.has(`${listing.id}-${variation.id}`)}
                                                                className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50"
                                                            >
                                                                {saving.has(`${listing.id}-${variation.id}`) ? (
                                                                    <div className="animate-spin h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full"></div>
                                                                ) : (
                                                                    <FiSave className="h-4 w-4" />
                                                                )}
                                                            </button>
                                                            <button
                                                                onClick={() => cancelEditing(listing.id, true, variation.id)}
                                                                className="p-1 text-gray-400 hover:text-gray-600"
                                                            >
                                                                <FiX className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center">
                                                            <span className={`text-sm font-medium ${
                                                                variation.quantity <= 5 
                                                                    ? 'text-orange-600' 
                                                                    : variation.quantity === 0 
                                                                        ? 'text-red-600' 
                                                                        : 'text-gray-900'
                                                            }`}>
                                                                {variation.quantity} units
                                                            </span>
                                                            {variation.quantity <= 5 && (
                                                                <FiAlertTriangle className="ml-1 h-4 w-4 text-orange-500" />
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {/* Empty for variations */}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                                    {!editingItems.has(`${listing.id}-${variation.id}`) && (
                                                        <button
                                                            onClick={() => startEditing(listing.id, true, variation.id)}
                                                            className="text-[#72b01d] hover:text-[#5d8f18] flex items-center"
                                                        >
                                                            <FiEdit className="h-4 w-4 mr-1" />
                                                            Edit Stock
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
