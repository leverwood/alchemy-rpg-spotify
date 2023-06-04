import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";

import { exchangeCodeForToken } from "./popup/spotify";

function App() {
  const [success, setSuccess] = useState(null);
  useEffect(() => {
    // Extract the authorization code from the URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    console.log(urlParams);

    // Save the authorization code to the extension's local storage
    chrome.storage.local.set({ authorizationCode: code }, () => {
      setSuccess(true);
    });

    exchangeCodeForToken(code).then((res) => {
      console.log(res);
    });
  }, []);
  return (
    <div>
      <h1>
        {success === null
          ? "Authorizing Spotify..."
          : "You have successfully authorized Spotify"}
      </h1>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));
