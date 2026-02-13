let baseUrl = "/api/Payments";

export const createTenancy = async ({ tenancyPayload}) => {
  const response = await fetch(`${baseUrl.replace("Payments","Tenancies")}`, {
   method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenancyPayload }),
        Authorization: `Bearer ${localStorage.getItem("token")}`
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data);
  }
  console.log(data);
  return data;
};