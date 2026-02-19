let baseUrl = "/api/Tenancies";

export const createTenancy = async (tenancyPayload) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${baseUrl}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(tenancyPayload),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  return response.json();
};
