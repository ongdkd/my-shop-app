"use client";

import React, { useState, useEffect, useRef } from "react";
import { PosTerminal } from "@/types";
import { PlusIcon, PencilIcon, TrashIcon, EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import { getPosTerminals, updatePosTerminal, addPosTerminal, deletePosTerminal } from "@/lib/posData";

export default function AdminPOSPage() {
  const [posTerminals, setPosTerminals] = useState<PosTerminal[]>([]);

  useEffect(() => {
    // Load POS terminals from shared data source
    const terminals = getPosTerminals();
    setPosTerminals(terminals);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPos, setEditingPos] = useState<PosTerminal | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    themeColor: "#3B82F6",
  });
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleAddPOS = () => {
    // Generate next POS number automatically
    const nextPosNumber = posTerminals.length + 1;
    const newPOS: PosTerminal = {
      id: `pos${nextPosNumber}`,
      name: formData.name.trim() || `POS ${nextPosNumber}`,
      themeColor: formData.themeColor,
      isActive: true,
    };

    addPosTerminal(newPOS);
    setPosTerminals((prev) => [...prev, newPOS]);
    setFormData({ name: "", themeColor: "#3B82F6" });
    setIsAddModalOpen(false);
  };

  const handleEditPOS = (pos: PosTerminal) => {
    setEditingPos(pos);
    setFormData({
      name: pos.name,
      themeColor: pos.themeColor,
    });
    setIsAddModalOpen(true);
  };

  const handleUpdatePOS = () => {
    if (!editingPos) return;

    if (!formData.name.trim()) {
      alert("Please enter a POS name for editing");
      return;
    }

    const updatedPos = { 
      ...editingPos, 
      name: formData.name, 
      themeColor: formData.themeColor 
    };

    updatePosTerminal(updatedPos);
    setPosTerminals((prev) =>
      prev.map((pos) =>
        pos.id === editingPos.id ? updatedPos : pos
      )
    );

    setEditingPos(null);
    setFormData({ name: "", themeColor: "#3B82F6" });
    setIsAddModalOpen(false);
  };

  const handleDeletePOS = (posId: string) => {
    if (confirm("Are you sure you want to delete this POS terminal?")) {
      deletePosTerminal(posId);
      setPosTerminals((prev) => prev.filter((pos) => pos.id !== posId));
    }
  };

  const handleTogglePOS = (posId: string) => {
    const updatedTerminals = posTerminals.map((pos) =>
      pos.id === posId ? { ...pos, isActive: !pos.isActive } : pos
    );
    
    const updatedPos = updatedTerminals.find(pos => pos.id === posId);
    if (updatedPos) {
      updatePosTerminal(updatedPos);
      
      // Trigger a custom event to notify other components
      window.dispatchEvent(new CustomEvent('posTerminalUpdated', {
        detail: { posId, isActive: updatedPos.isActive }
      }));
    }
    
    setPosTerminals(updatedTerminals);
  };

  const handleColorChange = (posId: string, newColor: string) => {
    const updatedTerminals = posTerminals.map((pos) =>
      pos.id === posId ? { ...pos, themeColor: newColor } : pos
    );
    
    const updatedPos = updatedTerminals.find(pos => pos.id === posId);
    if (updatedPos) {
      updatePosTerminal(updatedPos);
      
      // Trigger a custom event to notify other components
      window.dispatchEvent(new CustomEvent('posTerminalUpdated', {
        detail: { posId, themeColor: newColor }
      }));
    }
    
    setPosTerminals(updatedTerminals);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                POS Terminal Management
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Manage your POS terminals and customize their themes
              </p>
            </div>
            <button
              onClick={() => window.location.href = '/admin'}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 active:bg-gray-800 transition-colors touch-manipulation min-h-[44px] text-sm sm:text-base self-start sm:self-auto"
            >
              Back to Admin
            </button>
          </div>
        </div>

        {/* Add POS Button */}
        <div className="mb-6">
          <button
            onClick={() => {
              setEditingPos(null);
              setFormData({ name: "", themeColor: "#3B82F6" });
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            Add New POS Terminal
          </button>
        </div>

        {/* POS Terminals Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {posTerminals.map((pos) => (
            <div
              key={pos.id}
              className={`bg-white rounded-lg shadow-sm border overflow-hidden ${
                !pos.isActive ? 'opacity-75' : ''
              }`}
            >
              <div
                className="h-4"
                style={{ backgroundColor: pos.themeColor }}
              />

              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {pos.name}
                    </h3>
                    <span className="text-sm text-gray-500">ID: {pos.id}</span>
                  </div>
                  
                  {/* 3-dot menu */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setOpenDropdown(openDropdown === pos.id ? null : pos.id)}
                      className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <EllipsisVerticalIcon className="w-6 h-6" />
                    </button>
                    
                    {openDropdown === pos.id && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10">
                        <button
                          onClick={() => {
                            handleEditPOS(pos);
                            setOpenDropdown(null);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <PencilIcon className="w-4 h-4" />
                          Edit POS
                        </button>
                        
                        <div className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              <div 
                                className="w-4 h-4 rounded border border-gray-300"
                                style={{ backgroundColor: pos.themeColor }}
                              />
                              Theme Color
                            </span>
                            <input
                              type="color"
                              value={pos.themeColor}
                              onChange={(e) => {
                                const newColor = e.target.value;
                                handleColorChange(pos.id, newColor);
                              }}
                              className="w-6 h-6 rounded border-0 cursor-pointer"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        
                        <hr className="my-1" />
                        
                        <button
                          onClick={() => {
                            handleDeletePOS(pos.id);
                            setOpenDropdown(null);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <TrashIcon className="w-4 h-4" />
                          Delete POS
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* POS Status Toggle */}
                <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${pos.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm font-medium text-gray-700">
                      {pos.isActive ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleTogglePOS(pos.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      pos.isActive ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        pos.isActive ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="mb-4">
                  <button
                    onClick={() =>
                      window.open(`/admin/pos-products?pos=${pos.id}`, "_blank")
                    }
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                    Edit Products
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add/Edit Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-semibold">
                  {editingPos ? "Edit POS Terminal" : "Add New POS Terminal"}
                </h2>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    POS Name {!editingPos && "(Optional - will auto-generate)"}
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={
                      editingPos
                        ? "Enter POS name"
                        : `POS ${posTerminals.length + 1} (auto-generated)`
                    }
                  />
                  {!editingPos && (
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty to auto-generate &quot;POS {posTerminals.length + 1}&quot;
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Theme Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.themeColor}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          themeColor: e.target.value,
                        }))
                      }
                      className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
                    />
                    <span className="text-sm text-gray-600 font-mono">
                      {formData.themeColor}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={editingPos ? handleUpdatePOS : handleAddPOS}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingPos ? "Update" : "Add"} POS
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
