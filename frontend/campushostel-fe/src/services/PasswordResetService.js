let baseUrl = "/api/Accounts";

export const RequestReset = async (payload) => {
  const response = await fetch(`${baseUrl}/request-reset`, {
    method: "Post",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw data;
  }
  return data;
};

export const VerifyReset = async (payload) => {
  const response = await fetch(`${baseUrl}/verify-reset`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw data;
  }

  return data;
};


export const ResetPassword = async (payload) => {
  const response = await fetch(`${baseUrl}/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw data;
  }

  return data;
};