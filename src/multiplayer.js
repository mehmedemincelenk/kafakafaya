import { onPlayerJoin } from "playroomkit";

export let playroomPlayers = [];
let initialized = false;
export let isConnected = false;

export function initMultiplayerListeners() {
  // Clear the local list on initialization to start with a fresh state
  playroomPlayers.length = 0;
  isConnected = true;

  if (initialized) return;
  initialized = true;

  onPlayerJoin((player) => {
    if (!playroomPlayers.some(p => p.id === player.id)) {
      playroomPlayers.push(player);
      // Sort alphabetically by ID to guarantee a 100% deterministic order across all clients
      playroomPlayers.sort((a, b) => a.id.localeCompare(b.id));
    }
    player.onQuit(() => {
      const idx = playroomPlayers.findIndex(p => p.id === player.id);
      if (idx !== -1) {
        playroomPlayers.splice(idx, 1);
      }
      playroomPlayers.sort((a, b) => a.id.localeCompare(b.id));
    });
  });
}
