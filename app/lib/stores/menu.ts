import { atom } from 'nanostores';

// Store to track if the sidebar menu is open or closed
export const menuStore = atom<boolean>(false);

// Toggle the menu open/closed state
export const toggleMenu = () => {
  menuStore.set(!menuStore.get());
};

// Set menu to a specific state (open or closed)
export const setMenuOpen = (isOpen: boolean) => {
  menuStore.set(isOpen);
};
