// lib/posData.ts
import { PosTerminal } from "@/types";

const POS_STORAGE_KEY = "pos-terminals-data";

// Default POS terminals
const defaultPosTerminals: PosTerminal[] = [
  { id: "pos1", name: "POS 1", themeColor: "#3B82F6", isActive: true },
  { id: "pos2", name: "POS 2", themeColor: "#10B981", isActive: true },
  { id: "pos3", name: "POS 3", themeColor: "#F59E0B", isActive: false },
];

// Get POS terminals from localStorage or use defaults
const loadPosTerminals = (): PosTerminal[] => {
  if (typeof window === "undefined") return defaultPosTerminals;
  
  try {
    const stored = localStorage.getItem(POS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Error loading POS terminals from localStorage:", error);
  }
  
  return defaultPosTerminals;
};

// Save POS terminals to localStorage
const savePosTerminals = (terminals: PosTerminal[]): void => {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(POS_STORAGE_KEY, JSON.stringify(terminals));
  } catch (error) {
    console.error("Error saving POS terminals to localStorage:", error);
  }
};

export const getPosTerminals = (): PosTerminal[] => {
  return loadPosTerminals();
};

export const getActivePosTerminals = (): PosTerminal[] => {
  return loadPosTerminals().filter(pos => pos.isActive);
};

export const updatePosTerminal = (updatedPos: PosTerminal): void => {
  const terminals = loadPosTerminals();
  const updatedTerminals = terminals.map(pos => 
    pos.id === updatedPos.id ? updatedPos : pos
  );
  savePosTerminals(updatedTerminals);
};

export const addPosTerminal = (newPos: PosTerminal): void => {
  const terminals = loadPosTerminals();
  terminals.push(newPos);
  savePosTerminals(terminals);
};

export const deletePosTerminal = (posId: string): void => {
  const terminals = loadPosTerminals();
  const filteredTerminals = terminals.filter(pos => pos.id !== posId);
  savePosTerminals(filteredTerminals);
};