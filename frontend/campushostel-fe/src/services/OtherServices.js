let baseUrl = "/api/Tenancies";

export const createTenancy = async (tenancyPayload) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${baseUrl}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(tenancyPayload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw data;
  }

  return data;
};

export const getPaidTenancies = async (tenantId) => {
  const response = await fetch(`${baseUrl}/paid/${tenantId}`);
  const data = await response.json();
  if (!response.ok) {
    throw data;
  }
  return data;
};
