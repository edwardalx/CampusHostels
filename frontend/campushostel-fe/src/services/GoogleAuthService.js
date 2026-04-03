

// src/services/GoogleAuthService.js
import { useGoogleLogin } from '@react-oauth/google';
let baseUrl = "/api/Accounts";
export const useGoogleAuth = (onLoginSuccess, onLoginError) => {
  const login = useGoogleLogin({
    onSuccess: async (credentialResponse) => {
      try {
        const idToken = credentialResponse.credential; // <-- your Google ID token

        // Send ID token to backend
        const res = await fetch(`${baseUrl}/google-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken })
        });

        if (!res.ok) throw new Error('Backend login failed');

        const data = await res.json();
        onLoginSuccess && onLoginSuccess(data); // return JWT & user info
      } catch (err) {
        console.error('Google login error:', err);
        onLoginError && onLoginError(err);
      }
    },
    onError: (err) => {
      console.error('Google OAuth error:', err);
      onLoginError && onLoginError(err);
    }
  });

  return login;
};

export const GoogleAuthWithToken = async(accessToken) => {
   const res = await fetch(`${baseUrl}/google-login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ accessToken }),
        },
      );

      const data = await res.json();

      if (data.token) {
        localStorage.setItem("token", data.token);
        // localStorage.setItem("user", JSON.stringify(data));
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
      }
}

