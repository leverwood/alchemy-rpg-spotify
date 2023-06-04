import { startPlaylist } from "../popup/spotify.js";

export function getGame() {
  // get the final part of the url betfore the query string
  const url = new URL(window.location.href);
  const path = url.pathname.split("/");
  const game = path[path.length - 1];
  // console.log("game", game);
  return game;
}

async function getScenes() {
  // console.log("getScenes");
  return new Promise((resolve, reject) => {
    const wrapper = document.querySelector("[data-rbd-droppable-id='scenes']");
    if (!wrapper) {
      // wait a second and try again
      setTimeout(async () => {
        resolve(await getScenes());
      }, 1000);
    } else {
      // console.log("got scenes");
      resolve(wrapper);
    }
  });
}

async function observeScenes(sceneObserver) {
  // console.log("Connecting to scenes");
  const wrapper = await getScenes();

  [...wrapper.children].forEach((scene) => {
    sceneObserver.observe(scene.children[1], { childList: true });
  });
}

async function init() {
  const game = getGame();

  const sceneObserver = new MutationObserver(async function (
    mutationsList,
    observer
  ) {
    for (let mutation of mutationsList) {
      if (mutation.type === "childList") {
        // console.log("A scene has been changed.", mutation.target);
        const title = mutation.target.querySelector("svg > title");
        if (!title || title.textContent !== "Group 4") {
          continue;
        }
        // todo: check if active scene changed
        const id = mutation.target.parentElement.getAttribute(
          "data-rbd-draggable-id"
        );
        let { playlists } = await chrome.storage.local.get(["playlists"]);
        if (!playlists) {
          playlists = {};
          chrome.storage.local.set({ playlists });
        }
        if (!playlists[game]) {
          playlists[game] = {};
          chrome.storage.local.set({ playlists });
        }
        const playlist = playlists[game][id];
        if (playlist) {
          startPlaylist(playlist);
        }
      }
    }
  });

  const wrapperObserver = new MutationObserver(async function (
    mutationsList,
    observer
  ) {
    for (let mutation of mutationsList) {
      if (mutation.type === "childList") {
        // console.log("A scene has been added or removed.", mutation.target);
        // reconnect to scenes
        sceneObserver.disconnect();
        observeScenes(sceneObserver);
      }
    }
  });

  const wrapper = await getScenes();
  wrapperObserver.observe(wrapper, { childList: true });

  observeScenes(sceneObserver);
}

init();
