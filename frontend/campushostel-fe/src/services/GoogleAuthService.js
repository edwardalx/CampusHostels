const baseUrl = "/api/Accounts";

/**
 * Exchanges a Google ID token for a Rentin session. The API verifies the token with Google and
 * checks it was issued to this app before creating or signing in the account.
 */
export const GoogleAuthWithIdToken = async (idToken) => {
  const res = await fetch(`${baseUrl}/google-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok || !data?.token) {
    throw new Error(data?.error ?? "Google sign-in failed. Please try again.");
  }

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
