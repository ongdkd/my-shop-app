// New API-based POS data library to replace localStorage-based posData.ts
import { 
  usePOSTerminals, 
  usePOSTerminalMutations,
  apiClient,
  handleApiError
} from '@/lib/api';
import { PosTerminal } from '@/types';

// For backward compatibility, we'll convert API POS terminals to old format
const apiPosTerminalToOldPosTerminal = (apiTerminal: any): PosTerminal => {
  return {
    id: apiTerminal.id,
    name: apiTerminal.terminal_name,
    themeColor: apiTerminal.configuration?.themeColor || '#3B82F6',
    isActive: apiTerminal.is_active,
  };
};

const oldPosTerminalToApiCreateRequest = (oldTerminal: Omit<PosTerminal, 'id'>) => {
  return {
    terminal_name: oldTerminal.name,
    configuration: {
      themeColor: oldTerminal.themeColor,
    },
  };
};

const oldPosTerminalToApiUpdateRequest = (oldTerminal: Partial<PosTerminal>) => {
  const update: any = {};
  
  if (oldTerminal.name !== undefined) update.terminal_name = oldTerminal.name;
  if (oldTerminal.isActive !== undefined) update.is_active = oldTerminal.isActive;
  if (oldTerminal.themeColor !== undefined) {
    update.configuration = { themeColor: oldTerminal.themeColor };
  }
  
  return update;
};

/**
 * Get all POS terminals
 */
export const getPosTerminals = async (): Promise<PosTerminal[]> => {
  try {
    const apiTerminals = await apiClient.getPOSTerminals();
    return apiTerminals.map(apiPosTerminalToOldPosTerminal);
  } catch (error) {
    console.error("Error fetching POS terminals:", error);
    return [];
  }
};

/**
 * Get active POS terminals only
 */
export const getActivePosTerminals = async (): Promise<PosTerminal[]> => {
  try {
    const apiTerminals = await apiClient.getPOSTerminals(true); // Get active only
    return apiTerminals.map(apiPosTerminalToOldPosTerminal);
  } catch (error) {
    console.error("Error fetching active POS terminals:", error);
    return [];
  }
};

/**
 * Update a POS terminal
 */
export const updatePosTerminal = async (updatedPos: PosTerminal): Promise<void> => {
  try {
    const updateRequest = oldPosTerminalToApiUpdateRequest(updatedPos);
    await apiClient.updatePOSTerminal(updatedPos.id, updateRequest);
  } catch (error) {
    console.error("Error updating POS terminal:", error);
    throw new Error(handleApiError(error));
  }
};

/**
 * Add a new POS terminal
 */
export const addPosTerminal = async (newPos: Omit<PosTerminal, 'id'>): Promise<void> => {
  try {
    const createRequest = oldPosTerminalToApiCreateRequest(newPos);
    await apiClient.createPOSTerminal(createRequest);
  } catch (error) {
    console.error("Error adding POS terminal:", error);
    throw new Error(handleApiError(error));
  }
};

/**
 * Delete a POS terminal
 */
export const deletePosTerminal = async (posId: string): Promise<void> => {
  try {
    await apiClient.deletePOSTerminal(posId);
  } catch (error) {
    console.error("Error deleting POS terminal:", error);
    throw new Error(handleApiError(error));
  }
};

// React hooks for easier component integration
export { usePOSTerminals, usePOSTerminalMutations } from '@/lib/api';