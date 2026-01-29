let baseUrl = "/api/Accounts";

export const LiginApi = async ({loginData}) => {
  const response = await fetch(`${baseUrl}/login`,{
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
  return data;
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
  localStorage.setItem("user", JSON.stringify(data.phoneNumber));
  return data;
};

