let baseUrl = "/api/Payments";
// The API ties every payment call to the signed-in tenant, so each request carries the token.
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export const initailizePayments = async (payload) => {
  const response = await fetch(`${baseUrl}/initialize`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw data;
  }
  console.log(data);
  return data;
};

export const verifyPayments = async (reference) => {
  const response = await fetch(`${baseUrl}/verify`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ reference }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data);
  }
  console.log(data);
  return data;
};

export const getPaymentHistory = async (tenantId) => {
  const response = await fetch(`${baseUrl}/tenant/${tenantId}`, {
    headers: authHeaders(),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data);
  }
  console.log(data);
  return data;
};

