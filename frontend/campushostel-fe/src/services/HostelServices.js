
let baseUrl = "/api/Properties";

export const getHostels = async () => {
  const response = await fetch(baseUrl);

  if (!response.ok) {
    throw new Error("Failed to fetch hostels");
  }

  const data = await response.json(); // ✅ THIS is the real data
  console.log(data);
  return data;
};

export const getHostelById = async (id) => {
  const response = await fetch(`${baseUrl}/${id}`);

  if (!response.ok) {
    throw new Error("Failed to fetch hostels");
  }

  const data = await response.json(); // ✅ THIS is the real data
  console.log(data);
  return data;
};

export const getUnitsByPropertyId = async (id) => {
  const response = await fetch(`${baseUrl}/${id}/Units`); //
  if (!response.ok) {
    throw new Error("Failed to fetch hostels");
  }

  const data = await response.json(); // ✅ THIS is the real data
  console.log("Units", data);
  return data;
};