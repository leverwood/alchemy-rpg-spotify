const CLIENT_ID = "be460798f1664649983584ba00b85ab2";
const SPOTIFY_APP =
  "YmU0NjA3OThmMTY2NDY0OTk4MzU4NGJhMDBiODVhYjI6NjM1MDFhZWNmNzE3NDhjZmFiOTQzNGFjNjU1ZjhlMGM=";
const REDIRECT_URI =
  "chrome-extension://ilnfbfnbbndbgmddbfdhbndmiikacohk/oauth_callback.html";
const scopes = [
  "user-read-playback-state",
  "user-read-currently-playing",
  "user-modify-playback-state",
];

export async function exchangeCodeForToken() {
  const { authorizationCode } = await chrome.storage.local.get([
    "authorizationCode",
  ]);

  if (!authorizationCode) {
    return authorizeApp();
  }

  return fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: "Basic " + SPOTIFY_APP,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code: authorizationCode,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  })
    .then((response) => {
      console.log(response);
      return response.json();
    })
    .then((data) => {
      console.log("exchangeCodeForToken", data);
      const accessToken = data.access_token;
      const expiresIn = data.expires_in;
      const newRefreshToken = data.refresh_token;

      // Save the access token, refresh token, and expiration time to the extension's local storage
      chrome.storage.local.set({
        accessToken: res.accessToken,
        refreshToken: res.newRefreshToken,
        tokenExpires: Date.now() + res.expiresIn,
      });

      return { accessToken, newRefreshToken, expiresIn };
    })
    .catch((error) => {
      console.error(
        "Error exchanging authorization code for access token:",
        error
      );
    });
}

export async function doRefreshToken() {
  const { refreshToken, authorizationCode } = await chrome.storage.local.get([
    "refreshToken",
    "authorizationCode",
  ]);

  if (!refreshToken || !authorizationCode) {
    return authorizeApp();
  }

  return fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: "Basic " + SPOTIFY_APP,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("refreshToken", data);
      const accessToken = data.access_token;
      const tokenExpires = Date.now() + data.expires_in;

      // Save the access token, refresh token
      chrome.storage.local.set({
        accessToken,
        tokenExpires,
      });
      return { accessToken, tokenExpires, refreshToken };
    })
    .catch((error) => {
      console.error("Error refreshing access token:", error);
    });
}

export function authorizeApp() {
  const authorizeUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&scope=${encodeURIComponent(scopes.join(" "))}`;
  chrome.tabs.create({ url: authorizeUrl });
}

export async function checkAuthorization() {
  const { authorizationCode, tokenExpires, accessToken, refreshToken } =
    await chrome.storage.local.get([
      "authorizationCode",
      "tokenExpires",
      "accessToken",
      "refreshToken",
    ]);
  if (!authorizationCode) {
    return authorizeApp();
  } else if (!accessToken || !tokenExpires) {
    return exchangeCodeForToken();
  } else if (Date.now() > tokenExpires) {
    return doRefreshToken();
  } else
    return {
      accessToken,
      refreshToken,
      tokenExpires,
      authorizationCode,
    };
}

export async function startPlaylist(playlistURI) {
  const playing = await getCurrentlyPlaying();
  if (playing && playlistURI.includes(playing)) {
    return;
  }
  const { accessToken } = await checkAuthorization();

  return fetch("https://api.spotify.com/v1/me/player/play", {
    method: "PUT",
    headers: {
      Authorization: "Bearer " + accessToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      context_uri: playlistURI,
    }),
  })
    .then((response) => {
      if (response.ok) {
        console.log("Playlist started successfully.");
      } else {
        console.error(
          "Failed to start playlist:",
          response.status,
          response.statusText
        );
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

export async function getDevices() {
  const { accessToken } = await checkAuthorization();

  return fetch("https://api.spotify.com/v1/me/player/devices", {
    method: "GET",
    headers: {
      Authorization: "Bearer " + accessToken,
    },
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("getDevices", data);
      const activeID = data.devices.find((device) => device.is_active).id;
      return activeID;
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

export async function getCurrentlyPlaying() {
  const { accessToken } = await checkAuthorization();

  return fetch("https://api.spotify.com/v1/me/player", {
    method: "GET",
    headers: {
      Authorization: "Bearer " + accessToken,
    },
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("getCurrentlyPlaying", data);
      const parts = data.context.uri.split(":");
      return parts[parts.length - 1];
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}
