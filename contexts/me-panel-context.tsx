import { createContext, useContext } from 'react';
import type { Units } from '@/utils/units';

type MePanelContextValue = {
  meOpen: boolean;
  openMe: () => void;
  closeMe: () => void;
  units: Units;
  setUnits: (u: Units) => void;
  darkMode: boolean;
  setDarkMode: (d: boolean) => void;
};

export const MePanelContext = createContext<MePanelContextValue>({
  meOpen: false,
  openMe: () => {},
  closeMe: () => {},
  units: 'metric',
  setUnits: () => {},
  darkMode: false,
  setDarkMode: () => {},
});

export const useMePanel = () => useContext(MePanelContext);
export const useUnits = () => useContext(MePanelContext).units;
