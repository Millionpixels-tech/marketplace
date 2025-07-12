// Sri Lankan Districts organized by Province
export interface District {
  name: string;
  province: string;
}

export interface Province {
  name: string;
  districts: string[];
}

export const sriLankanProvinces: Province[] = [
  {
    name: "Western Province",
    districts: ["Colombo", "Gampaha", "Kalutara"]
  },
  {
    name: "Central Province", 
    districts: ["Kandy", "Matale", "Nuwara Eliya"]
  },
  {
    name: "Southern Province",
    districts: ["Galle", "Matara", "Hambantota"]
  },
  {
    name: "Northern Province",
    districts: ["Jaffna", "Kilinochchi", "Mannar", "Vavuniya", "Mullaitivu"]
  },
  {
    name: "Eastern Province",
    districts: ["Batticaloa", "Ampara", "Trincomalee"]
  },
  {
    name: "North Western Province",
    districts: ["Kurunegala", "Puttalam"]
  },
  {
    name: "North Central Province",
    districts: ["Anuradhapura", "Polonnaruwa"]
  },
  {
    name: "Uva Province",
    districts: ["Badulla", "Moneragala"]
  },
  {
    name: "Sabaragamuwa Province",
    districts: ["Ratnapura", "Kegalle"]
  }
];

export const getAllDistricts = (): District[] => {
  const districts: District[] = [];
  sriLankanProvinces.forEach(province => {
    province.districts.forEach(district => {
      districts.push({
        name: district,
        province: province.name
      });
    });
  });
  return districts.sort((a, b) => a.name.localeCompare(b.name));
};

export const getDistrictsByProvince = (provinceName: string): string[] => {
  const province = sriLankanProvinces.find(p => p.name === provinceName);
  return province ? province.districts : [];
};

export const getProvinceByDistrict = (districtName: string): string | null => {
  for (const province of sriLankanProvinces) {
    if (province.districts.includes(districtName)) {
      return province.name;
    }
  }
  return null;
};
