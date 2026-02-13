let baseUrl = "/api/Payments";

export const initailizePayments = async ({ payload }) => {
  const response = await fetch(`${baseUrl}/initialize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data);
  }
  console.log(data);
  return data;
};

export const verifyPayments = async ({ reference}) => {
  const response = await fetch(`${baseUrl}/verify`, {
   method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference })
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data);
  }
  console.log(data);
  return data;
};


