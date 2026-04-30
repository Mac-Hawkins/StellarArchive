import * as SecureStore from "expo-secure-store";
import { jwtDecode } from "jwt-decode";

// Retrieves the JWT from the keychain.
export async function getToken() {
  const token = await SecureStore.getItemAsync("jwt");
  return token;
}

// Stores JWT securely in the keychain.
export async function saveToken(jwt: string) {
  await SecureStore.setItemAsync("jwt", jwt);
}

// Gets the token and decodes it.
export async function getDecodedToken() {
  const token = await getToken();
  return token ? jwtDecode(token) : null;
}

// Returns the user ID from the decoded token.
export async function getUserId() {
  const decoded: any = await getDecodedToken();
  return decoded?.userId ?? null;
}

// Checks to see if the token is not expired
async function hasTokenExpired() {
  try {
    const decoded: any = await getDecodedToken();
    const now = Math.floor(Date.now() / 1000);

    if (decoded.exp && decoded.exp < now) {
      return true;
    }

    return false;
  } catch {
    return true;
  }
}

// If token exists, we can assume that the user is logged in.
export async function isLoggedIn() {
  const token = await getToken();

  if (!token || (await hasTokenExpired())) {
    // Delete the token if it expired.
    await SecureStore.deleteItemAsync("jwt");
    return false;
  }

  return true;
}

// Deletes the JWT.
export async function logout() {
  await SecureStore.deleteItemAsync("jwt");
}
