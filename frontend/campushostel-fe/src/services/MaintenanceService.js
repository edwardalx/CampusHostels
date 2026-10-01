const baseUrl = "/api/Maintenance";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

async function request(url, options, fallbackMessage) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error ?? fallbackMessage);
  }
  return data;
}

// Current tenancies the signed-in tenant can raise a request against.
export const getMyMaintenanceTenancies = () =>
  request(
    `${baseUrl}/my-tenancies`,
    { headers: authHeaders() },
    "Unable to load your tenancies",
  );

export const getMyMaintenanceRequests = () =>
  request(
    `${baseUrl}/mine`,
    { headers: authHeaders() },
    "Unable to load your requests",
  );

export const createMaintenanceRequest = (payload) =>
  request(
    baseUrl,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    },
    "Unable to submit your request",
  );
