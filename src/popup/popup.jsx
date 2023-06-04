import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";

import { startPlaylist, getCurrentlyPlaying } from "./spotify";
import { getScenes, getGame } from "./alchemy";

function App() {
  const [scenes, setScenes] = useState(null);
  const [playlists, setPlaylists] = useState(null);
  const [game, setGame] = useState(null);

  // get scenes on load
  useEffect(async () => {
    const newGame = await getGame();
    setGame(newGame ? newGame : false);

    const { playlists: savedPlaylists } = await chrome.storage.local.get([
      "playlists",
    ]);
    if (savedPlaylists && savedPlaylists[newGame]) setPlaylists(savedPlaylists);
    else setPlaylists({});

    const scenes = await getScenes();
    setScenes(scenes);
  }, []);

  const changePlaylist = async (e) => {
    setPlaylists((playlists) => {
      if (!playlists) playlists = {};
      if (!playlists[game]) playlists[game] = {};
      const newGame = {
        ...playlists[game],
        [e.target.name]: e.target.value,
      };
      const newPlaylists = {
        ...playlists,
        [game]: newGame,
      };
      chrome.storage.local.set({ playlists: newPlaylists });
      return newPlaylists;
    });
  };

  if (game === null) {
    return (
      <div style={{ width: 200 }}>
        <span>Loading...</span>
      </div>
    );
  }

  if (game === false)
    return (
      <div style={{ width: 250 }}>
        <span>Must be on an Alchemy RPG Game page</span>
      </div>
    );

  return (
    <div>
      <h1>Alchemy RPG Spotify Player</h1>
      <p>In spotify, click Share {">"} Copy link to playlist.</p>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {scenes &&
          scenes.map((scene) => (
            <li
              style={{
                padding: "0.5em 0",
                display: "flex",
                justifyContent: "right",
              }}
            >
              <div style={{ marginRight: "1em", whiteSpace: "nowrap" }}>
                {scene.name}
              </div>
              <input
                name={scene.id}
                onChange={changePlaylist}
                value={
                  (playlists && playlists[game] && playlists[game][scene.id]) ||
                  ""
                }
              />
            </li>
          ))}
      </ul>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));
