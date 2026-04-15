import { showSessionExpiredAlert } from "../hooks/useIdleTimeout";
let baseUrl = "/api/Accounts";

export const LoginApi = async ({ loginData }) => {
  const response = await fetch(`${baseUrl}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(loginData),
  });
  const data = await response.json(); // ✅ THIS is the real data
  if (!response.ok) {
    throw data;
  }
  console.log("API service data", data);
  localStorage.setItem("token", data.token);
  localStorage.setItem("expires", JSON.stringify(data.expires));
  localStorage.setItem(
    "user",
    JSON.stringify({
      phone: data.phoneNumber,
      fname: data.firstName,
      tenantId: data.tenantId,
    }),
  );
  return data;
};

export const LogoutApi = async () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("expires");
};

export const RegisterApi = async (regData) => {
  const response = await fetch(`${baseUrl}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(regData),
  });

  const data = await response.json();

  if (!response.ok) {
    // 🔥 throw backend validation errors
    throw data;
  }
  localStorage.setItem("token", data.token);
  localStorage.setItem(
    "user",
    JSON.stringify({ phone: data.phoneNumber, fname: data.firstName }),
  );
  return data;
};

export const RegisterAjax = async (regData) => {
  const response = await fetch(`${baseUrl}/check-email-phone`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(regData),
  });

  const data = await response.json();

  if (!response.ok) {
    // 🔥 throw backend validation errors
    throw data;
  }
  return data;
};

export const likeProperty = async (payload) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${baseUrl}/liked-hostels/add?tenantId=${payload.tenantId}&hostelId=${payload.propertyId}`, {
    method: "POST",
    // body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw data;
  }

  return data;
};

export const unlikeProperty = async (payload) => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${baseUrl}/liked-hostels/remove?tenantId=${payload.tenantId}&hostelId=${payload.propertyId}`, {
    method: "POST",
    // body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw data;
  }

  return data;
};

export const getLikedHostels = async (tenantId) => {
  const response = await fetch(`${baseUrl}/liked-hostels?tenantId=${tenantId}`);
  const data = await response.json();
  console.log("Liked hostels", data);
  if (!response.ok) {
    throw data;
  }
  return data;
};
