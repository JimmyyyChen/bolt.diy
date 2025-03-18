import { atom } from 'nanostores';

// Store to track if the sidebar menu is open or closed
export const menuStore = atom<boolean>(false);

// Store to track the menu toggle button element reference
export const menuToggleButtonRef = atom<HTMLElement | null>(null);

// Toggle the menu open/closed state
export const toggleMenu = () => {
  menuStore.set(!menuStore.get());
};

// Set menu to a specific state (open or closed)
export const setMenuOpen = (isOpen: boolean) => {
  menuStore.set(isOpen);
};
