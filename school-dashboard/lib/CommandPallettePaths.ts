interface CommandPalettePath {
  id: string;
  name: string;
  icon: string;
  path: string;
}

export const commandPallettePaths: CommandPalettePath[] = [
  {
    id: 'links',
    name: 'Links',
    icon: '🔗',
    path: '/links',
  },
  {
    id: 'calendar',
    name: 'Calendar',
    icon: '📆',
    path: '/calendar',
  },
  {
    id: 'callback',
    name: 'Callback',
    icon: '📥',
    path: '/callback',
  },
  {
    id: 'users',
    name: 'Users',
    icon: '👤',
    path: '/users',
  },
  {
    id: 'pbis',
    name: 'PBIS',
    icon: '🪪',
    path: '/pbis',
  },
  {
    id: 'discipline',
    name: 'Discipline',
    icon: '📝',
    path: '/discipline',
  },

  {
    id: 'allTeacherCurrentWork',
    name: 'All Teacher Current Work',
    icon: '📝',
    path: '/allTeacherCurrentWork',
  },
  {
    id: 'Bullying',
    name: 'Hazing Harassment Bullying',
    icon: '😢',
    path: '/Bullying',
  },
  {
    id: 'home',
    name: 'Home',
    icon: '🏠',
    path: '/',
  },
];
