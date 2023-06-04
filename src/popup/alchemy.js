export async function getGame() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const results = await chrome.scripting.executeScript({
    target: { tabId: tabs[0].id },
    func: queryGame,
  });
  return results[0].result;
}

function queryGame() {
  if (!window.location.href.includes("app.alchemyrpg.com/game")) return false;
  const url = new URL(window.location.href);
  const path = url.pathname.split("/");
  const game = path[path.length - 1];
  return game;
}

function queryPage() {
  const SCENES_SELECTOR = "[data-rbd-droppable-id='scenes'] > div";
  const scenes = [...document.querySelectorAll(SCENES_SELECTOR)];
  console.log("scenes", scenes);
  // return scenes;
  return scenes.map((scene) => {
    return {
      id: scene.getAttribute("data-rbd-draggable-id"),
      name: scene.innerText,
    };
  });
}

export async function getScenes() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const results = await chrome.scripting.executeScript({
    target: { tabId: tabs[0].id },
    func: queryPage,
  });
  return results[0].result;
}
