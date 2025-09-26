"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EllipsisVerticalIcon,
} from "@heroicons/react/24/outline";
import { usePOSTerminalsQuery, usePOSTerminalMutations } from "@/lib/api";
import AuthGuard from "@/components/AuthGuard";
import ConnectionStatus from "@/components/ConnectionStatus";
import AuthDebug from "@/components/AuthDebug";

interface PosTerminal {
  id: string;
  name: string;
  themeColor: string;
  isActive: boolean;
}

export default function AdminPOSPage() {
  const {
    data: apiTerminals = [],
    loading: isLoading,
    error,
    refetch,
  } = usePOSTerminalsQuery();
  const { createTerminal, updateTerminal, deleteTerminal } =
    usePOSTerminalMutations();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPos, setEditingPos] = useState<PosTerminal | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    themeColor: "#3B82F6",
  });
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ✅ Convert API terminals to local format
  const posTerminals: PosTerminal[] = (apiTerminals || []).map((terminal) => ({
    id: terminal.id,
    name: terminal.terminal_name,
    themeColor: terminal.configuration?.theme_color || "#3B82F6",
    isActive: terminal.is_active,
  }));

  // ✅ Ensure initial fetch runs only once on mount
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // ======================
  // CRUD HANDLERS
  // ======================

  const handleAddPOS = async () => {
    try {
      const nextPosNumber = posTerminals.length + 1;
      const newPOSData = {
        terminal_name: formData.name.trim() || `POS ${nextPosNumber}`,
        location: "Store",
        configuration: {
          theme_color: formData.themeColor,
          theme: "light",
          receipt_printer: true,
          cash_drawer: true,
        },
        is_active: true,
      };

      const result = await createTerminal(newPOSData);
      if (result) {
        setFormData({ name: "", themeColor: "#3B82F6" });
        setIsAddModalOpen(false);
        await refetch();
      } else {
        alert("Failed to create POS terminal");
      }
    } catch (error) {
      console.error("Error creating POS terminal:", error);
      alert("Failed to create POS terminal");
    }
  };

  const handleEditPOS = (pos: PosTerminal) => {
    setEditingPos(pos);
    setFormData({ name: pos.name, themeColor: pos.themeColor });
    setIsAddModalOpen(true);
  };

  const handleUpdatePOS = async () => {
    if (!editingPos) return;
    if (!formData.name.trim()) {
      alert("Please enter a POS name");
      return;
    }

    try {
      const updatedData = {
        terminal_name: formData.name,
        location: "Store",
        configuration: {
          theme_color: formData.themeColor,
          theme: "light",
          receipt_printer: true,
          cash_drawer: true,
        },
        is_active: editingPos.isActive,
      };

      const result = await updateTerminal(editingPos.id, updatedData);
      if (result) {
        setEditingPos(null);
        setFormData({ name: "", themeColor: "#3B82F6" });
        setIsAddModalOpen(false);
        await refetch();
      } else {
        alert("Failed to update POS terminal");
      }
    } catch (error) {
      console.error("Error updating POS terminal:", error);
      alert("Failed to update POS terminal");
    }
  };

  const handleDeletePOS = async (posId: string) => {
    if (confirm("Are you sure you want to delete this POS terminal?")) {
      try {
        const result = await deleteTerminal(posId);
        if (result) {
          await refetch();
        } else {
          alert("Failed to delete POS terminal");
        }
      } catch (error) {
        console.error("Error deleting POS terminal:", error);
        alert("Failed to delete POS terminal");
      }
    }
  };

  const handleTogglePOS = async (posId: string) => {
    const currentPos = posTerminals.find((pos) => pos.id === posId);
    if (!currentPos) return;

    try {
      const updatedData = {
        terminal_name: currentPos.name,
        location: "Store",
        configuration: {
          theme_color: currentPos.themeColor,
          theme: "light",
          receipt_printer: true,
          cash_drawer: true,
        },
        is_active: !currentPos.isActive,
      };

      const result = await updateTerminal(posId, updatedData);
      if (result) {
        window.dispatchEvent(
          new CustomEvent("posTerminalUpdated", {
            detail: { posId, isActive: !currentPos.isActive },
          })
        );
        await refetch();
      } else {
        alert("Failed to toggle POS terminal");
      }
    } catch (error) {
      console.error("Error toggling POS terminal:", error);
      alert("Failed to update POS terminal");
    }
  };

  const handleColorChange = async (posId: string, newColor: string) => {
    const currentPos = posTerminals.find((pos) => pos.id === posId);
    if (!currentPos) return;

    try {
      const updatedData = {
        terminal_name: currentPos.name,
        location: "Store",
        configuration: {
          theme_color: newColor,
          theme: "light",
          receipt_printer: true,
          cash_drawer: true,
        },
        is_active: currentPos.isActive,
      };

      const result = await updateTerminal(posId, updatedData);
      if (result) {
        window.dispatchEvent(
          new CustomEvent("posTerminalUpdated", {
            detail: { posId, themeColor: newColor },
          })
        );
        await refetch();
      } else {
        alert("Failed to update POS terminal color");
      }
    } catch (error) {
      console.error("Error updating POS terminal color:", error);
      alert("Failed to update POS terminal color");
    }
  };

  // ======================
  // RENDER
  // ======================

  if (isLoading) {
    return (
      <AuthGuard requiredRole="admin">
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-600">Loading POS terminals...</p>
        </div>
      </AuthGuard>
    );
  }

  if (error) {
    return (
      <AuthGuard requiredRole="admin">
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-red-600">Error: {String(error)}</p>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requiredRole="admin">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">POS Terminal Management</h1>
            <div className="flex items-center gap-3">
              <ConnectionStatus showDetails={false} />
              <button
                onClick={() => (window.location.href = "/admin")}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Back to Admin
              </button>
            </div>
          </div>

          <AuthDebug />

          {/* Empty State */}
          {posTerminals.length === 0 && (
            <div className="p-6 bg-blue-50 border rounded-lg text-center">
              <p className="mb-4 text-blue-700">
                No POS Terminals Found. Create your first terminal to get started.
              </p>
              <button
                onClick={() => {
                  setEditingPos(null);
                  setFormData({ name: "", themeColor: "#3B82F6" });
                  setIsAddModalOpen(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <PlusIcon className="w-5 h-5 inline-block mr-1" />
                Create First Terminal
              </button>
            </div>
          )}

          {/* Grid of POS Terminals */}
          {posTerminals.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {posTerminals.map((pos) => (
                <div
                  key={pos.id}
                  className={`bg-white rounded-lg shadow-sm border ${
                    !pos.isActive ? "opacity-75" : ""
                  }`}
                >
                  <div className="h-2" style={{ backgroundColor: pos.themeColor }} />
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <h3 className="font-semibold">{pos.name}</h3>
                        <p className="text-xs text-gray-500">ID: {pos.id}</p>
                      </div>
                      <div className="relative" ref={dropdownRef}>
                        <button
                          onClick={() =>
                            setOpenDropdown(openDropdown === pos.id ? null : pos.id)
                          }
                          className="p-2 text-gray-400 hover:text-gray-600"
                        >
                          <EllipsisVerticalIcon className="w-5 h-5" />
                        </button>
                        {openDropdown === pos.id && (
                          <div className="absolute right-0 mt-1 w-40 bg-white border rounded shadow">
                            <button
                              onClick={() => {
                                handleEditPOS(pos);
                                setOpenDropdown(null);
                              }}
                              className="block w-full px-3 py-1 text-sm hover:bg-gray-100"
                            >
                              <PencilIcon className="w-4 h-4 inline mr-1" />
                              Edit
                            </button>
                            <div className="px-3 py-1 text-sm flex justify-between items-center">
                              <span>Theme</span>
                              <input
                                type="color"
                                value={pos.themeColor}
                                onChange={(e) => handleColorChange(pos.id, e.target.value)}
                                className="w-6 h-6 border-0 cursor-pointer"
                              />
                            </div>
                            <button
                              onClick={() => {
                                handleDeletePOS(pos.id);
                                setOpenDropdown(null);
                              }}
                              className="block w-full px-3 py-1 text-sm text-red-600 hover:bg-red-50"
                            >
                              <TrashIcon className="w-4 h-4 inline mr-1" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`text-sm font-medium ${
                          pos.isActive ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {pos.isActive ? "Online" : "Offline"}
                      </span>
                      <button
                        onClick={() => handleTogglePOS(pos.id)}
                        className={`w-10 h-5 flex items-center rounded-full ${
                          pos.isActive ? "bg-blue-600" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`h-4 w-4 bg-white rounded-full transform transition ${
                            pos.isActive ? "translate-x-5" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={() =>
                          (window.location.href = `/admin/pos-terminals/${pos.id}/products`)
                        }
                        className="w-full px-3 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200"
                      >
                        Manage Products
                      </button>
                      <button
                        onClick={() => window.open(`/pos/${pos.id}`, "_blank")}
                        className="w-full px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        Launch POS
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add/Edit Modal */}
          {isAddModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-md w-full">
                <div className="flex justify-between items-center p-4 border-b">
                  <h2 className="text-lg font-semibold">
                    {editingPos ? "Edit POS Terminal" : "Add New POS Terminal"}
                  </h2>
                  <button
                    onClick={() => setIsAddModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm mb-1">POS Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, name: e.target.value }))
                      }
                      className="w-full border rounded px-2 py-1"
                      placeholder={
                        editingPos
                          ? "Enter POS name"
                          : `POS ${posTerminals.length + 1} (auto-generated)`
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Theme Color</label>
                    <input
                      type="color"
                      value={formData.themeColor}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          themeColor: e.target.value,
                        }))
                      }
                      className="w-12 h-8 cursor-pointer"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setIsAddModalOpen(false)}
                      className="flex-1 bg-gray-100 text-gray-700 py-2 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={editingPos ? handleUpdatePOS : handleAddPOS}
                      className="flex-1 bg-blue-600 text-white py-2 rounded"
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
    </AuthGuard>
  );
}
