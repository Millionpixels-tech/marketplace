import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { serviceCategories, serviceCategoryIcons, serviceSubcategoryIcons, ServiceCategory, getServiceSubcategories } from "../../utils/serviceCategories";
import { getAllDistricts } from "../../utils/sriLankanDistricts";
import type { Service } from "../../types/service";
import ResponsiveHeader from "../../components/UI/ResponsiveHeader";
import Footer from "../../components/UI/Footer";
import { SEOHead } from "../../components/SEO/SEOHead";
import { getCanonicalUrl, generateKeywords } from "../../utils/seo";
import { useResponsive } from "../../hooks/useResponsive";
import { Button, Input } from "../../components/UI";
import Pagination from "../../components/UI/Pagination";
import { useServices } from "../../hooks/useServices";
import type { ServiceFilters } from "../../hooks/useServices";

export default function ServicesPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  
  const [showFilters, setShowFilters] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  
  // Filter input states (what user types/selects)
  const [searchInput, setSearchInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | 'all'>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [deliveryTypeFilter, setDeliveryTypeFilter] = useState<'all' | 'onsite' | 'online'>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [minPriceFilter, setMinPriceFilter] = useState("");
  const [maxPriceFilter, setMaxPriceFilter] = useState("");
  const [sortFilter, setSortFilter] = useState("");
  
  // Applied filter states (what's actually applied to the query)
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedCategory, setAppliedCategory] = useState<ServiceCategory | 'all'>('all');
  const [appliedSubcategory, setAppliedSubcategory] = useState<string>('');
  const [appliedDeliveryType, setAppliedDeliveryType] = useState<'all' | 'onsite' | 'online'>('all');
  const [appliedLocation, setAppliedLocation] = useState<string>('all');
  const [appliedMinPrice, setAppliedMinPrice] = useState("");
  const [appliedMaxPrice, setAppliedMaxPrice] = useState("");
  const [appliedSort, setAppliedSort] = useState("");
  
  // Build filters for the hook using applied states
  const filters: ServiceFilters = {
    category: appliedCategory,
    subcategory: appliedSubcategory || undefined,
    deliveryType: appliedDeliveryType,
    location: appliedLocation === 'all' ? undefined : appliedLocation,
    minPrice: appliedMinPrice ? parseFloat(appliedMinPrice) : undefined,
    maxPrice: appliedMaxPrice ? parseFloat(appliedMaxPrice) : undefined,
    search: appliedSearch || undefined,
    sortBy: appliedSort as ServiceFilters['sortBy'] || undefined
  };

  // Use the services hook
  const { services, loading, pagination, loadPage } = useServices(filters);

  // Sync with URL params
  useEffect(() => {
    const cat = (searchParams.get("cat") as ServiceCategory) || 'all';
    const sub = searchParams.get("sub") || '';
    const search = searchParams.get("q") || "";
    const minPrice = searchParams.get("min") || "";
    const maxPrice = searchParams.get("max") || "";
    const sort = searchParams.get("sort") || "";
    const delivery = (searchParams.get("delivery") as 'all' | 'onsite' | 'online') || 'all';
    const location = searchParams.get("location") || 'all';
    
    // Set input states
    setSelectedCategory(cat);
    setSelectedSubcategory(sub);
    setSearchInput(search);
    setMinPriceFilter(minPrice);
    setMaxPriceFilter(maxPrice);
    setSortFilter(sort);
    setDeliveryTypeFilter(delivery);
    setLocationFilter(location);
    
    // Set applied states
    setAppliedCategory(cat);
    setAppliedSubcategory(sub);
    setAppliedSearch(search);
    setAppliedMinPrice(minPrice);
    setAppliedMaxPrice(maxPrice);
    setAppliedSort(sort);
    setAppliedDeliveryType(delivery);
    setAppliedLocation(location);
  }, [searchParams]);

  const handleCategoryClick = (categoryName: string) => {
    const newCategory = selectedCategory === categoryName ? 'all' : (categoryName as ServiceCategory);
    setSelectedCategory(newCategory);
    setSelectedSubcategory('');
    setAppliedCategory(newCategory);
    setAppliedSubcategory('');
    setExpanded(null);
    updateUrlParams({
      cat: newCategory === 'all' ? null : newCategory,
      sub: null
    });
  };

  const handleSubcategoryClick = (categoryName: string, subcategoryName: string) => {
    setSelectedCategory(categoryName as ServiceCategory);
    setSelectedSubcategory(subcategoryName);
    setAppliedCategory(categoryName as ServiceCategory);
    setAppliedSubcategory(subcategoryName);
    updateUrlParams({
      cat: categoryName,
      sub: subcategoryName
    });
  };

  const updateUrlParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    navigate({ pathname: "/services", search: params.toString() });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSearch(searchInput);
    updateUrlParams({ q: searchInput || null });
  };

  const applyFilters = () => {
    // Set applied states
    setAppliedMinPrice(minPriceFilter);
    setAppliedMaxPrice(maxPriceFilter);
    setAppliedSort(sortFilter);
    setAppliedDeliveryType(deliveryTypeFilter);
    setAppliedLocation(locationFilter);
    
    updateUrlParams({
      min: minPriceFilter || null,
      max: maxPriceFilter || null,
      sort: sortFilter || null,
      delivery: deliveryTypeFilter === 'all' ? null : deliveryTypeFilter,
      location: locationFilter === 'all' ? null : locationFilter
    });
    if (isMobile) setShowFilters(false);
  };

  const resetFilters = () => {
    // Reset input states
    setMinPriceFilter("");
    setMaxPriceFilter("");
    setSortFilter("");
    setDeliveryTypeFilter('all');
    setLocationFilter('all');
    setSelectedCategory('all');
    setSelectedSubcategory('');
    setSearchInput('');
    
    // Reset applied states
    setAppliedMinPrice("");
    setAppliedMaxPrice("");
    setAppliedSort("");
    setAppliedDeliveryType('all');
    setAppliedLocation('all');
    setAppliedCategory('all');
    setAppliedSubcategory('');
    setAppliedSearch('');
    
    updateUrlParams({
      min: null,
      max: null,
      sort: null,
      delivery: null,
      location: null,
      cat: null,
      sub: null,
      q: null
    });
    if (isMobile) setShowFilters(false);
  };

  const clearSearchFilter = () => {
    setSearchInput('');
    updateUrlParams({ q: null });
  };

  const ServiceCard = ({ service }: { service: Service }) => {
    // Safety check for packages
    const hasPackages = service.packages && service.packages.length > 0;
    const minPrice = hasPackages ? Math.min(...service.packages.map(pkg => pkg.price)) : 0;
    const maxPrice = hasPackages ? Math.max(...service.packages.map(pkg => pkg.price)) : 0;
    
    return (
      <Link 
        to={`/service/${service.id}`}
        className="block bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden group cursor-pointer h-full"
      >
        {/* Service Image - Increased size */}
        <div className="relative h-64 bg-gray-100">
          {service.images && service.images.length > 0 ? (
            <img 
              src={service.images[0]} 
              alt={service.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#72b01d] to-[#3f7d20]">
              <span className="text-4xl text-white">
                {(() => {
                  const IconComponent = serviceCategoryIcons[service.category];
                  return IconComponent ? <IconComponent className="w-8 h-8" /> : <span className="text-2xl">🔧</span>;
                })()}
              </span>
            </div>
          )}
          
          {/* Category Badge */}
          <div className="absolute top-3 left-3">
            <span className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-gray-700">
              {service.category}
            </span>
          </div>
          
          {/* Delivery Type Badge */}
          <div className="absolute top-3 right-3">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              service.deliveryType === 'Online' 
                ? 'bg-blue-100 text-blue-700'
                : service.deliveryType === 'Onsite'
                ? 'bg-green-100 text-green-700'
                : 'bg-purple-100 text-purple-700'
            }`}>
              {service.deliveryType}
            </span>
          </div>
        </div>

        {/* Service Content */}
        <div className="p-4 pb-6 flex flex-col">
          {/* Top section with title and packages */}
          <div className="flex-1">
            {/* Title - exactly 2 lines */}
            <h3 className="font-bold text-lg text-gray-900 mb-1 leading-tight" 
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  minHeight: '3.5rem',
                  maxHeight: '3.5rem'
                }}>
              {service.title}
            </h3>

            {/* Rating - show under title with consistent spacing */}
            <div className="flex items-center gap-2 mb-2 min-h-[22px]">
              {service.rating && service.rating > 0 ? (
                <>
                  <span className="flex items-center text-[#72b01d]">
                    {[1, 2, 3, 4, 5].map(i => (
                      <svg
                        key={i}
                        width="16"
                        height="16"
                        className="inline-block"
                        fill={i <= Math.round(service.rating!) ? "currentColor" : "none"}
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ))}
                    <span className="ml-1 text-xs font-bold text-[#3f7d20]">
                      {service.rating.toFixed(1)}
                    </span>
                  </span>
                  <span className="text-xs text-[#72b01d]">
                    ({service.reviewCount || 0})
                  </span>
                </>
              ) : (
                <span className="text-xs text-gray-400">No reviews yet</span>
              )}
            </div>

            {/* Packages Available */}
            {hasPackages && (
              <div className="mb-6">
                <div className="text-sm text-gray-600 font-medium">
                  {service.packages.length} package{service.packages.length !== 1 ? 's' : ''} available
                </div>
              </div>
            )}
          </div>

          {/* Bottom section with price */}
          <div className="mt-auto">
            {hasPackages && minPrice > 0 ? (
              <div>
                <span className="text-xs text-gray-500">Starting from</span>
                <div className="font-bold text-lg">
                  LKR {minPrice.toLocaleString()}
                  {minPrice !== maxPrice && (
                    <span className="text-sm text-gray-500"> - LKR {maxPrice.toLocaleString()}</span>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <span className="text-sm text-gray-500">Contact for pricing</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    );
  };

  return (
    <>
      <SEOHead
        title="Professional Services - Find Expert Service Providers | Sina.lk"
        description="Browse professional services from verified providers across Sri Lanka. From web development to fitness training, find the perfect service for your needs."
        keywords={generateKeywords([
          'professional services',
          'service providers',
          'freelance services',
          'business services',
          'online services',
          'Sri Lankan professionals',
          'expert services'
        ])}
        canonicalUrl={getCanonicalUrl('/services')}
      />
      <ResponsiveHeader />
      
      <div className={`w-full min-h-screen bg-gray-50 ${isMobile ? 'py-4 px-2' : 'py-10 px-1 md:px-4'}`}>
        <div className={`flex ${isMobile ? 'flex-col gap-6' : 'flex-col md:flex-row md:gap-10'} w-full`}>
          
          {/* Mobile Filter Toggle */}
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

          {/* Sidebar Filters */}
          <aside className={`${isMobile ? (showFilters ? 'block' : 'hidden') : 'w-full md:w-80'} ${isMobile ? 'w-full' : 'mb-8 md:mb-0'} flex flex-col ${isMobile ? 'gap-4' : 'gap-6'}`}>
            
            {/* Service Categories Filter */}
            <div className={`rounded-2xl overflow-hidden shadow-lg border ${isMobile ? 'mx-1' : ''}`} style={{ backgroundColor: '#ffffff', borderColor: 'rgba(114, 176, 29, 0.3)' }}>
              <div className={`flex items-center gap-2 ${isMobile ? 'px-4 py-3' : 'px-6 py-4'} border-b`} style={{ borderBottomColor: 'rgba(114, 176, 29, 0.2)'}}>
                <svg width={isMobile ? "18" : "20"} height={isMobile ? "18" : "20"} fill="none" viewBox="0 0 24 24"><path stroke="#72b01d" strokeWidth="1.5" d="M4 7h16M6 12h12M8 17h8" strokeLinecap="round" /></svg>
                <h2 className={`${isMobile ? 'text-sm' : 'text-base'} font-semibold tracking-tight`} style={{ color: '#0d0a0b' }}>Service Categories</h2>
              </div>
              <ul className={`flex flex-col gap-1 ${isMobile ? 'px-4 py-4' : 'px-6 py-5'}`}>
                <li className="flex flex-col">
                  <button
                    className={`text-left ${isMobile ? 'px-2 py-1.5 text-sm' : 'px-3 py-2'} rounded-lg font-medium transition-all duration-300 ${selectedCategory === 'all' ? "text-white shadow-lg" : ""}`}
                    style={{
                      backgroundColor: selectedCategory === 'all' ? '#72b01d' : 'transparent',
                      color: selectedCategory === 'all' ? '#ffffff' : '#0d0a0b'
                    }}
                    onClick={() => handleCategoryClick('all')}
                  >
                    All Services
                  </button>
                </li>
                {serviceCategories.map((category) => {
                  const subcategories = getServiceSubcategories(category.name);
                  return (
                    <li key={category.name} className="flex flex-col">
                      <div className="flex items-center w-full group">
                        <button
                          className={`flex items-center flex-1 text-left ${isMobile ? 'px-2 py-1.5 text-sm' : 'px-3 py-2'} rounded-lg font-medium transition-all duration-300 ${selectedCategory === category.name ? "text-white shadow-lg" : ""}`}
                          style={{
                            backgroundColor: selectedCategory === category.name ? '#72b01d' : 'transparent',
                            color: selectedCategory === category.name ? '#ffffff' : '#0d0a0b'
                          }}
                          onClick={() => handleCategoryClick(category.name)}
                        >
                          <span className="mr-2 flex-shrink-0">
                            {(() => {
                              const IconComponent = serviceCategoryIcons[category.name];
                              return IconComponent ? <IconComponent className="w-4 h-4" /> : null;
                            })()}
                          </span>
                          <span className="flex-1">{category.name}</span>
                        </button>
                        {subcategories.length > 0 && (
                          <button
                            className="ml-1 p-1 rounded transition-all duration-300"
                            style={{ color: '#72b01d' }}
                            aria-label={expanded === category.name ? `Collapse ${category.name}` : `Expand ${category.name}`}
                            onClick={e => {
                              e.stopPropagation();
                              setExpanded(expanded === category.name ? null : category.name);
                            }}
                          >
                            {expanded === category.name ? (
                              <svg width={isMobile ? "14" : "16"} height={isMobile ? "14" : "16"} fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M18 15l-6-6-6 6" strokeLinecap="round" /></svg>
                            ) : (
                              <svg width={isMobile ? "14" : "16"} height={isMobile ? "14" : "16"} fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M9 18l6-6-6-6" strokeLinecap="round" /></svg>
                            )}
                          </button>
                        )}
                      </div>
                      {expanded === category.name && subcategories.length > 0 && (
                        <ul className={`${isMobile ? 'pl-4 py-2' : 'pl-6 py-2'} flex flex-col gap-1`}>
                          {subcategories.map(subcategory => (
                            <li key={subcategory}>
                              <button
                                className={`flex items-center w-full text-left ${isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'} rounded-lg transition-all duration-300 ${selectedSubcategory === subcategory ? "text-white shadow-lg" : ""}`}
                                style={{
                                  backgroundColor: selectedSubcategory === subcategory ? '#3f7d20' : 'transparent',
                                  color: selectedSubcategory === subcategory ? '#ffffff' : '#454955'
                                }}
                                onClick={() => handleSubcategoryClick(category.name, subcategory)}
                              >
                                <span className="mr-2 flex-shrink-0">
                                  {serviceSubcategoryIcons[subcategory] ? (
                                    React.createElement(serviceSubcategoryIcons[subcategory], { className: "w-3 h-3" })
                                  ) : (
                                    <div className="w-3 h-3"></div>
                                  )}
                                </span>
                                <span className="flex-1">{subcategory}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Additional Filters */}
            <div className={`rounded-2xl overflow-hidden shadow-lg border ${isMobile ? 'mx-1' : ''}`} style={{ backgroundColor: '#ffffff', borderColor: 'rgba(114, 176, 29, 0.3)' }}>
              <div className={`flex items-center gap-2 ${isMobile ? 'px-4 py-3' : 'px-6 py-4'} border-b`} style={{ borderBottomColor: 'rgba(114, 176, 29, 0.2)' }}>
                <svg width={isMobile ? "18" : "20"} height={isMobile ? "18" : "20"} fill="none" viewBox="0 0 24 24"><path stroke="#72b01d" strokeWidth="1.5" d="M3 6h18M6 12h12M10 18h4" strokeLinecap="round" /></svg>
                <h2 className={`${isMobile ? 'text-sm' : 'text-base'} font-semibold tracking-tight`} style={{ color: '#0d0a0b' }}>More Filters</h2>
              </div>
              <div className={`flex flex-col ${isMobile ? 'gap-4' : 'gap-6'} ${isMobile ? 'px-4 py-4' : 'px-6 py-6'}`}>
                
                {/* Delivery Type */}
                <div>
                  <label className={`block ${isMobile ? 'text-xs' : 'text-xs'} font-semibold mb-2`} style={{ color: '#454955' }}>Service Type</label>
                  <select
                    className={`w-full ${isMobile ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm'} rounded-lg border outline-none transition-all`}
                    style={{
                      backgroundColor: '#ffffff',
                      borderColor: 'rgba(114, 176, 29, 0.3)',
                      color: '#0d0a0b'
                    }}
                    value={deliveryTypeFilter}
                    onChange={e => setDeliveryTypeFilter(e.target.value as 'all' | 'onsite' | 'online')}
                  >
                    <option value="all">All Services</option>
                    <option value="onsite">On-site Services</option>
                    <option value="online">Online Services</option>
                  </select>
                </div>
                
                {/* Location Filter */}
                <div>
                  <label className={`block ${isMobile ? 'text-xs' : 'text-xs'} font-semibold mb-2`} style={{ color: '#454955' }}>Location</label>
                  <select
                    className={`w-full ${isMobile ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm'} rounded-lg border outline-none transition-all`}
                    style={{
                      backgroundColor: '#ffffff',
                      borderColor: 'rgba(114, 176, 29, 0.3)',
                      color: '#0d0a0b'
                    }}
                    value={locationFilter}
                    onChange={e => setLocationFilter(e.target.value)}
                  >
                    <option value="all">All Locations</option>
                    {getAllDistricts().map(district => (
                      <option key={district.name} value={district.name}>
                        {district.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="border-t" style={{ borderTopColor: 'rgba(114, 176, 29, 0.2)' }} />
                
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
                      value={minPriceFilter}
                      onChange={e => setMinPriceFilter(e.target.value)}
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
                      value={maxPriceFilter}
                      onChange={e => setMaxPriceFilter(e.target.value)}
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
                    value={sortFilter}
                    onChange={e => setSortFilter(e.target.value)}
                  >
                    <option value="">Most Recent</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>
                
                {/* Apply/Reset Buttons */}
                <div className={`flex gap-2 ${isMobile ? 'mt-1' : 'mt-2'}`}>
                  <Button
                    className={`flex-1 ${isMobile ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'} rounded-lg text-white font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5`}
                    style={{
                      background: 'linear-gradient(to right, #72b01d, #3f7d20)'
                    }}                onClick={() => {
                  applyFilters();
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
                  resetFilters();
                }}
              >
                Reset
              </Button>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Search Bar */}
            <div className={`${isMobile ? 'mb-4' : 'mb-8'}`}>
              <form
                className="flex w-full gap-0"
                onSubmit={handleSearch}
              >
                <Input
                  className={`flex-1 outline-none ${isMobile ? 'px-3 py-2 text-base' : 'px-5 py-3 text-lg'} rounded-l-xl rounded-r-none font-medium transition border border-r-0`}
                  style={{
                    backgroundColor: '#ffffff',
                    borderColor: 'rgba(114, 176, 29, 0.3)',
                    color: '#0d0a0b'
                  }}
                  placeholder="Search services..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  aria-label="Search services"
                />
                <Button
                  type="submit"
                  className={`${isMobile ? 'px-4 py-2 text-base' : 'px-6 py-3 text-lg'} rounded-l-none rounded-r-xl text-white font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 border`}
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

            {/* Active Filters Display */}
            {(searchInput || selectedCategory !== 'all' || selectedSubcategory || minPriceFilter || maxPriceFilter || sortFilter || deliveryTypeFilter !== 'all' || locationFilter !== 'all') && (
              <div className={`${isMobile ? 'mb-4' : 'mb-6'}`}>
                <div className={`flex ${isMobile ? 'flex-col gap-2' : 'flex-col sm:flex-row sm:items-center sm:justify-between gap-4'}`}>
                  <div className={`flex flex-wrap ${isMobile ? 'gap-1' : 'gap-2'}`}>
                    {searchInput && (
                      <span className={`inline-flex items-center gap-1 ${isMobile ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs'} rounded-full font-medium border`} 
                            style={{ backgroundColor: 'rgba(114, 176, 29, 0.1)', borderColor: 'rgba(114, 176, 29, 0.3)', color: '#72b01d' }}>
                        Search: "{searchInput}"
                        <button 
                          onClick={clearSearchFilter}
                          className="ml-1 hover:bg-red-100 rounded-full p-0.5"
                        >
                          <svg width={isMobile ? "10" : "12"} height={isMobile ? "10" : "12"} fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" strokeWidth="2" d="M18 6L6 18M6 6l12 12"/>
                          </svg>
                        </button>
                      </span>
                    )}
                    
                    {selectedCategory !== 'all' && (
                      <span className={`inline-flex items-center gap-1 ${isMobile ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs'} rounded-full font-medium border`} 
                            style={{ backgroundColor: 'rgba(114, 176, 29, 0.1)', borderColor: 'rgba(114, 176, 29, 0.3)', color: '#72b01d' }}>
                        {selectedCategory}
                      </span>
                    )}
                    
                    {selectedSubcategory && (
                      <span className={`inline-flex items-center gap-1 ${isMobile ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs'} rounded-full font-medium border`} 
                            style={{ backgroundColor: 'rgba(114, 176, 29, 0.1)', borderColor: 'rgba(114, 176, 29, 0.3)', color: '#72b01d' }}>
                        {selectedSubcategory}
                      </span>
                    )}
                    
                    {deliveryTypeFilter !== 'all' && (
                      <span className={`inline-flex items-center gap-1 ${isMobile ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs'} rounded-full font-medium border`} 
                            style={{ backgroundColor: 'rgba(114, 176, 29, 0.1)', borderColor: 'rgba(114, 176, 29, 0.3)', color: '#72b01d' }}>
                        {deliveryTypeFilter === 'onsite' ? 'On-site' : 'Online'}
                      </span>
                    )}
                    
                    {locationFilter !== 'all' && (
                      <span className={`inline-flex items-center gap-1 ${isMobile ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs'} rounded-full font-medium border`} 
                            style={{ backgroundColor: 'rgba(114, 176, 29, 0.1)', borderColor: 'rgba(114, 176, 29, 0.3)', color: '#72b01d' }}>
                        {locationFilter}
                      </span>
                    )}
                    
                    {minPriceFilter && (
                      <span className={`inline-flex items-center gap-1 ${isMobile ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs'} rounded-full font-medium border`} 
                            style={{ backgroundColor: 'rgba(114, 176, 29, 0.1)', borderColor: 'rgba(114, 176, 29, 0.3)', color: '#72b01d' }}>
                        Min: LKR {minPriceFilter}
                      </span>
                    )}
                    
                    {maxPriceFilter && (
                      <span className={`inline-flex items-center gap-1 ${isMobile ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs'} rounded-full font-medium border`} 
                            style={{ backgroundColor: 'rgba(114, 176, 29, 0.1)', borderColor: 'rgba(114, 176, 29, 0.3)', color: '#72b01d' }}>
                        Max: LKR {maxPriceFilter}
                      </span>
                    )}
                    
                    {sortFilter && (
                      <span className={`inline-flex items-center gap-1 ${isMobile ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs'} rounded-full font-medium border`} 
                            style={{ backgroundColor: 'rgba(114, 176, 29, 0.1)', borderColor: 'rgba(114, 176, 29, 0.3)', color: '#72b01d' }}>
                        Sort: {sortFilter === 'price-asc' ? 'Price ↑' : sortFilter === 'price-desc' ? 'Price ↓' : sortFilter === 'newest' ? 'Newest' : sortFilter === 'oldest' ? 'Oldest' : sortFilter}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Results Grid */}
            {loading ? (
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 rounded-2xl h-64 mb-3"></div>
                    <div className="bg-gray-200 rounded h-4 mb-2"></div>
                    <div className="bg-gray-200 rounded h-4 w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : services.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No services found</h3>
                <p className="text-gray-600 mb-6">
                  {selectedCategory === 'all' 
                    ? "No services match your current filters. Try adjusting your search criteria."
                    : `No services found in the ${selectedCategory} category. Try browsing other categories or adjusting your filters.`
                  }
                </p>
                <button
                  onClick={resetFilters}
                  className="bg-[#72b01d] text-white px-6 py-3 rounded-lg hover:bg-[#3f7d20] transition-colors font-medium"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <>
                {/* Services Grid */}
                <div className={`w-full grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'}`}>
                  {services.map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
                
                {/* Pagination */}
                <div className="mt-12">
                  <Pagination
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    onPageChange={loadPage}
                    totalItems={pagination.totalItems}
                    showInfo={true}
                    showJumpTo={false}
                    maxVisiblePages={5}
                  />
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      <Footer />
    </>
  );
}
