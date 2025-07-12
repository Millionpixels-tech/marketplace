import { useState } from "react";
import { FiPlus, FiTrash2, FiEdit3, FiCheck, FiX } from "react-icons/fi";
import { Button } from "../UI";
import type { ServicePackage } from "../../types/service";

interface ServicePackagesProps {
  packages: ServicePackage[];
  onChange: (packages: ServicePackage[]) => void;
  maxPackages?: number;
}

export const createDefaultPackage = (): ServicePackage => ({
  id: crypto.randomUUID(),
  name: "",
  description: "",
  price: 0,
  duration: "1",
  durationType: "Minutely" as any,
  features: [""],
  deliveryTime: "1 week",
  isPopular: false
});

export default function ServicePackages({ packages, onChange, maxPackages = 3 }: ServicePackagesProps) {
  const [editingPackage, setEditingPackage] = useState<string | null>(null);
  const [tempPackage, setTempPackage] = useState<ServicePackage | null>(null);

  const addPackage = () => {
    if (packages.length >= maxPackages) return;
    
    const newPackage = createDefaultPackage();
    onChange([...packages, newPackage]);
    setEditingPackage(newPackage.id);
    setTempPackage(newPackage);
  };

  const updatePackage = (packageId: string, updates: Partial<ServicePackage>) => {
    let updatedPackages = packages.map(pkg => 
      pkg.id === packageId ? { ...pkg, ...updates } : pkg
    );
    
    // If marking a package as popular, unmark all others
    if (updates.isPopular === true) {
      updatedPackages = updatedPackages.map(pkg => 
        pkg.id === packageId ? { ...pkg, ...updates } : { ...pkg, isPopular: false }
      );
    }
    
    onChange(updatedPackages);
  };

  const removePackage = (packageId: string) => {
    if (packages.length <= 1) return; // Keep at least one package
    onChange(packages.filter(pkg => pkg.id !== packageId));
    if (editingPackage === packageId) {
      setEditingPackage(null);
      setTempPackage(null);
    }
  };

  const startEditing = (pkg: ServicePackage) => {
    setEditingPackage(pkg.id);
    setTempPackage({ ...pkg });
  };

  const savePackage = () => {
    if (tempPackage) {
      updatePackage(tempPackage.id, tempPackage);
      setEditingPackage(null);
      setTempPackage(null);
    }
  };

  const cancelEditing = () => {
    if (tempPackage && !packages.find(p => p.id === tempPackage.id)?.name) {
      // If it's a new package with no name, remove it
      removePackage(tempPackage.id);
    }
    setEditingPackage(null);
    setTempPackage(null);
  };

  const addFeature = (packageId: string) => {
    if (editingPackage === packageId && tempPackage) {
      setTempPackage({
        ...tempPackage,
        features: [...tempPackage.features, ""]
      });
    }
  };

  const updateFeature = (packageId: string, featureIndex: number, value: string) => {
    if (editingPackage === packageId && tempPackage) {
      const updatedFeatures = [...tempPackage.features];
      updatedFeatures[featureIndex] = value;
      setTempPackage({
        ...tempPackage,
        features: updatedFeatures
      });
    }
  };

  const removeFeature = (packageId: string, featureIndex: number) => {
    if (editingPackage === packageId && tempPackage && tempPackage.features.length > 1) {
      const updatedFeatures = tempPackage.features.filter((_, index) => index !== featureIndex);
      setTempPackage({
        ...tempPackage,
        features: updatedFeatures
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[#0d0a0b]">Service Packages</h3>
          <p className="text-sm text-[#454955]">Create up to {maxPackages} packages for your service</p>
        </div>
        {packages.length < maxPackages && (
          <Button
            variant="secondary"
            onClick={addPackage}
            className="flex items-center gap-2 px-4 py-2 text-sm"
          >
            <FiPlus className="w-4 h-4" />
            Add Package
          </Button>
        )}
      </div>

      <div className="space-y-8">
        {packages.map((pkg, index) => (
          <div
            key={pkg.id}
            className={`border-2 rounded-xl p-6 bg-white transition-all ${
              pkg.isPopular 
                ? 'border-[#72b01d] shadow-lg bg-gradient-to-r from-[#72b01d]/5 to-transparent' 
                : 'border-[#e5e7eb] hover:shadow-md hover:border-[#72b01d]/30'
            }`}
          >
            {/* Package Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#72b01d] text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <span className="text-sm font-medium text-[#454955]">
                  Package {index + 1} of {packages.length}
                </span>
              </div>
              {editingPackage !== pkg.id && packages.length > 1 && (
                <button
                  onClick={() => removePackage(pkg.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Delete Package"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            {editingPackage === pkg.id && tempPackage ? (
              // Edit Mode
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-[#0d0a0b]">Edit Package</h4>
                </div>

                {/* Package Name and Description */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#0d0a0b] mb-1">
                      Package Name *
                    </label>
                    <input
                      type="text"
                      value={tempPackage.name}
                      onChange={(e) => setTempPackage({ ...tempPackage, name: e.target.value })}
                      placeholder="e.g., Basic, Standard, Premium"
                      className="w-full px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg focus:ring-2 focus:ring-[#72b01d] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#0d0a0b] mb-1">
                      Price (LKR) *
                    </label>
                    <input
                      type="number"
                      value={tempPackage.price}
                      onChange={(e) => setTempPackage({ ...tempPackage, price: Number(e.target.value) })}
                      min="0"
                      className="w-full px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg focus:ring-2 focus:ring-[#72b01d] focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-medium text-[#0d0a0b] mb-1">
                    Description *
                  </label>
                  <textarea
                    value={tempPackage.description}
                    onChange={(e) => setTempPackage({ ...tempPackage, description: e.target.value })}
                    placeholder="Describe what's included..."
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg focus:ring-2 focus:ring-[#72b01d] focus:border-transparent resize-none"
                  />
                </div>

                {/* Work Time */}
                <div>
                  <label className="block text-xs font-medium text-[#0d0a0b] mb-1">
                    How long will you work on this?
                  </label>
                  
                  {/* Project Based Option */}
                  <div className="mb-3">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`duration-type-${pkg.id}`}
                        checked={tempPackage.durationType === "Project Based"}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTempPackage({ 
                              ...tempPackage, 
                              durationType: "Project Based" as any,
                              duration: "Based on project requirements"
                            });
                          }
                        }}
                        className="w-4 h-4 text-[#72b01d] border-gray-300 focus:ring-0 focus:ring-offset-0"
                      />
                      <span className="text-sm text-[#0d0a0b]">Based on project</span>
                    </label>
                  </div>

                  {/* Time-based Option */}
                  <div className="mb-3">
                    <label className="flex items-center space-x-2 cursor-pointer mb-2">
                      <input
                        type="radio"
                        name={`duration-type-${pkg.id}`}
                        checked={tempPackage.durationType !== "Project Based"}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTempPackage({ 
                              ...tempPackage, 
                              durationType: "Minutely" as any,
                              duration: "1"
                            });
                          }
                        }}
                        className="w-4 h-4 text-[#72b01d] border-gray-300 focus:ring-0 focus:ring-offset-0"
                      />
                      <span className="text-sm text-[#0d0a0b]">Specific time duration</span>
                    </label>
                    
                    {/* Number and Unit inputs - only shown when time-based is selected */}
                    {tempPackage.durationType !== "Project Based" && (
                      <div className="flex gap-2 ml-6">
                        <input
                          type="number"
                          value={tempPackage.duration}
                          onChange={(e) => setTempPackage({ ...tempPackage, duration: e.target.value })}
                          placeholder="1"
                          min="1"
                          className="w-20 px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg focus:ring-2 focus:ring-[#72b01d] focus:border-transparent"
                        />
                        <select
                          value={tempPackage.durationType}
                          onChange={(e) => setTempPackage({ ...tempPackage, durationType: e.target.value as any })}
                          className="flex-1 px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg focus:ring-2 focus:ring-[#72b01d] focus:border-transparent"
                        >
                          <option value="Minutely">Minutes</option>
                          <option value="Hourly">Hours</option>
                          <option value="Daily">Days</option>
                          <option value="Weekly">Weeks</option>
                          <option value="Monthly">Months</option>
                        </select>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-xs text-[#454955] mt-1">Specify how long you'll spend working on this package</p>
                </div>

                {/* Features */}
                <div>
                  <label className="block text-xs font-medium text-[#0d0a0b] mb-1">
                    Features
                  </label>
                  <div className="space-y-2">
                    {tempPackage.features.map((feature, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={feature}
                          onChange={(e) => updateFeature(pkg.id, index, e.target.value)}
                          placeholder={`Feature ${index + 1}`}
                          className="flex-1 px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg focus:ring-2 focus:ring-[#72b01d] focus:border-transparent"
                        />
                        {tempPackage.features.length > 1 && (
                          <button
                            onClick={() => removeFeature(pkg.id, index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Remove Feature"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => addFeature(pkg.id)}
                      className="w-full px-3 py-2 text-sm text-[#72b01d] border border-dashed border-[#72b01d] rounded-lg hover:bg-[#72b01d]/5 transition"
                    >
                      + Add Feature
                    </button>
                  </div>
                </div>

                {/* Mark as Popular */}
                <div>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempPackage.isPopular || false}
                      onChange={(e) => {
                        const isPopular = e.target.checked;
                        setTempPackage({ ...tempPackage, isPopular });
                        
                        // If marking as popular, immediately update other packages to remove their popular status
                        if (isPopular) {
                          const updatedPackages = packages.map(pkg => 
                            pkg.id === tempPackage.id ? pkg : { ...pkg, isPopular: false }
                          );
                          onChange(updatedPackages);
                        }
                      }}
                      className="w-4 h-4 text-[#72b01d] border-gray-300 rounded focus:ring-[#72b01d] focus:ring-2"
                    />
                    <span className="text-sm font-medium text-[#0d0a0b]">Mark as Popular Package</span>
                  </label>
                  <p className="text-xs text-[#454955] mt-1">Popular packages are highlighted to customers (only one can be popular)</p>
                </div>

                {/* Save and Cancel Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-[#e5e7eb]">
                  <button
                    onClick={cancelEditing}
                    className="px-4 py-2 text-sm text-[#454955] hover:text-red-600 hover:bg-red-50 rounded-lg transition flex items-center gap-2"
                  >
                    <FiX className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    onClick={savePackage}
                    className="px-4 py-2 text-sm bg-[#72b01d] text-white hover:bg-[#5a8a15] rounded-lg transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!tempPackage.name || !tempPackage.description || tempPackage.price <= 0 || !tempPackage.deliveryTime}
                  >
                    <FiCheck className="w-4 h-4" />
                    Save Package
                  </button>
                </div>
              </div>
            ) : (
              // View Mode
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-lg text-[#0d0a0b]">
                          {pkg.name || "Untitled Package"}
                        </h4>
                        {pkg.isPopular && (
                          <span className="px-2 py-1 text-xs font-medium bg-[#72b01d] text-white rounded-full">
                            Popular
                          </span>
                        )}
                      </div>
                      <div className="text-2xl font-bold text-[#72b01d]">
                        LKR {pkg.price.toLocaleString()}
                      </div>
                    </div>
                    <p className="text-sm text-[#454955] mb-3">
                      {pkg.description || "No description"}
                    </p>
                    
                    {pkg.duration && (
                      <div className="text-sm">
                        <span className="font-medium text-[#0d0a0b]">Work Time:</span>
                        <span className="text-[#454955] ml-2">
                          {pkg.durationType === "Project Based" 
                            ? "Based on project requirements"
                            : `${pkg.duration} ${pkg.durationType === "Minutely" ? "minute" : pkg.durationType === "Hourly" ? "hour" : pkg.durationType === "Daily" ? "day" : pkg.durationType === "Weekly" ? "week" : "month"}${parseInt(pkg.duration) > 1 ? "s" : ""}`
                          }
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => startEditing(pkg)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Edit Package"
                    >
                      <FiEdit3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {pkg.features.length > 0 && pkg.features[0] && (
                  <div>
                    <h5 className="text-xs font-medium text-[#0d0a0b] mb-2">Features:</h5>
                    <ul className="space-y-1">
                      {pkg.features.filter(f => f.trim()).map((feature, index) => (
                        <li key={index} className="text-sm text-[#454955] flex items-center gap-2">
                          <FiCheck className="w-3 h-3 text-green-600 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {(!pkg.name || !pkg.description || pkg.price <= 0 || !pkg.deliveryTime) && (
                  <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                    Incomplete package - please edit to add all required information (name, description, price, delivery time)
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {packages.length === 0 && (
        <div className="text-center py-8 border border-dashed border-[#e5e7eb] rounded-xl">
          <p className="text-[#454955] mb-4">No packages created yet</p>
          <Button
            variant="primary"
            onClick={addPackage}
            className="flex items-center gap-2 px-4 py-2"
          >
            <FiPlus className="w-4 h-4" />
            Create Your First Package
          </Button>
        </div>
      )}
    </div>
  );
}
