"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getActivePosTerminals } from "@/lib/posData";
import { PosTerminal } from "@/types";

export default function POSSelectionPage() {
  const router = useRouter();
  const [activePosTerminals, setActivePosTerminals] = useState<PosTerminal[]>(
    []
  );

  useEffect(() => {
    // Get only active POS terminals
    const loadActivePosTerminals = () => {
      const activePos = getActivePosTerminals();
      setActivePosTerminals(activePos);
    };

    loadActivePosTerminals();

    // Listen for storage changes (when admin updates POS status)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "pos-terminals-data") {
        loadActivePosTerminals();
      }
    };

    // Listen for custom POS update events
    const handlePosUpdate = () => {
      loadActivePosTerminals();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("posTerminalUpdated", handlePosUpdate);

    // Also refresh when window gains focus (for same-tab updates)
    const handleFocus = () => {
      loadActivePosTerminals();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("posTerminalUpdated", handlePosUpdate);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const handleSelectPOS = (posId: string) => {
    router.push(`/pos/${posId}`);
  };

  // Removed unused refreshPosTerminals function

  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-8 p-6 bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Select a POS Terminal
        </h1>
      </div>

      {activePosTerminals.length === 0 ? (
        <div className="text-center">
          <div className="text-6xl mb-4">🔌</div>
          <h2 className="text-2xl font-semibold text-gray-600 mb-2">
            No Active POS Terminals
          </h2>
          <p className="text-gray-500">
            All POS terminals are currently offline. Please contact an administrator.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-3xl w-full mt-6">
          {activePosTerminals.map((pos) => (
            <div key={pos.id} className="relative group">
              <button
                onClick={() => handleSelectPOS(pos.id)}
                className="w-full px-6 py-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 text-2xl font-semibold"
                style={{
                  color: pos.themeColor,
                  borderColor: pos.themeColor + "20",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = pos.themeColor + "10";
                  e.currentTarget.style.borderColor = pos.themeColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "white";
                  e.currentTarget.style.borderColor = pos.themeColor + "20";
                }}
              >
                <div className="flex items-center justify-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full bg-green-500"
                    title="Online"
                  />
                  {pos.name}
                </div>
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
