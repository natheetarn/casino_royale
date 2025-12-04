export interface GameMetadata {
  id: string;
  name: string;
  description: string;
  route: string;
  emoji: string;
  status: 'active' | 'coming-soon';
}

export const GAME_REGISTRY: GameMetadata[] = [
  {
    id: 'slots',
    name: 'Slots',
    description: 'Spin the reels and win big',
    route: '/games/slots',
    emoji: '🎰',
    status: 'active',
  },
  {
    id: 'landmines',
    name: 'Landmines',
    description: 'Navigate the grid, avoid the mines',
    route: '/games/landmines',
    emoji: '💣',
    status: 'active',
  },
  {
    id: 'roulette',
    name: 'Roulette',
    description: 'Bet on numbers, colors, or ranges',
    route: '/games/roulette',
    emoji: '🎲',
    status: 'active',
  },
];

export function getAllGames(): GameMetadata[] {
  return GAME_REGISTRY;
}

export function getGameById(id: string): GameMetadata | undefined {
  return GAME_REGISTRY.find((game) => game.id === id);
}

export function getActiveGames(): GameMetadata[] {
  return GAME_REGISTRY.filter((game) => game.status === 'active');
}

export function getComingSoonGames(): GameMetadata[] {
  return GAME_REGISTRY.filter((game) => game.status === 'coming-soon');
}

