"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, Trash2, Pencil, Play, X } from "lucide-react";

// Sample options for the dropdowns
const typeOptions = ["Input", "Button", "Link"];
const elementOptions = ["Element1", "Element2", "Element3"];
const actionOptions = ["Click", "Type", "Hover"];

export default function EnhancedEditableTable({
  data,
  visibleColumns,
  onRefresh,
  onEdit,
  onSave,
  onCancelEdit,
  onDeleteRow,
  onDeleteAll,
  onGlobalSearch,
  onClearGlobalSearch,
}) {
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState("");

  // Ensure only specified columns are displayed
  const columns = visibleColumns || Object.keys(data[0] || {});

  const handleEditClick = (rowIndex, column, value, type) => {
    if (column === "value" && type === "input") {
      setEditingCell({ rowIndex, column });
      setEditValue(value);
      onEdit(rowIndex, column, value, type);
    }
  };

  const handleSaveClick = () => {
    if (editingCell) {
      onSave(editingCell.rowIndex, editingCell.column, editValue);
      setEditingCell(null);
    }
  };

  const handleCancelEditClick = () => {
    setEditingCell(null);
    setEditValue("");
    onCancelEdit();
  };
  const handleReplayClick = () => {
    chrome.runtime.sendMessage({ type: "replayInteractions" });
  };

  return (
    <div className="container mx-auto p-4 relative">
      {/* Global Search and Actions */}
      <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
        <div className="relative w-full sm:w-64">
          <Input
            type="text"
            placeholder="Global Search..."
            onChange={onGlobalSearch}
            className="pr-8"
          />
          <Button
            variant="ghost"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 p-0"
            onClick={onClearGlobalSearch}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex space-x-2">
          <Button onClick={onRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={onDeleteAll}
            variant="outline"
            className="text-red-600 border-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete All
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-y-auto h-[calc(100vh-200px)] mb-16">
        <table className="w-full border-collapse table-auto">
          <thead className="sticky top-0 bg-white">
            <tr className="bg-gray-100">
              {columns.map((column) => (
                <th
                  key={column}
                  className="p-2 text-left font-semibold text-gray-700"
                >
                  {column}
                </th>
              ))}
              <th className="p-2 text-left font-semibold text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b">
                {columns.map((column) => (
                  <td key={column} className="p-2">
                    {editingCell?.rowIndex === rowIndex &&
                    editingCell?.column === column ? (
                      <div className="flex items-center space-x-2">
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full"
                        />
                        <Button onClick={handleSaveClick} size="sm">
                          Save
                        </Button>
                        <Button
                          onClick={handleCancelEditClick}
                          size="sm"
                          variant="outline"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="mr-2 break-words">{row[column]}</span>
                        {column === "value" && row.type === "input" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleEditClick(
                                rowIndex,
                                column,
                                row[column],
                                row.type
                              )
                            }
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                        )}
                      </div>
                    )}
                  </td>
                ))}
                <td className="p-2">
                  <Button
                    onClick={() => onDeleteRow(rowIndex)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete row</span>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Run Script Button */}
      <div className="fixed bottom-4 right-4">
        <Button
          onClick={handleReplayClick}
          variant="outline"
          className="text-blue-600 border-blue-600 hover:bg-blue-50"
        >
          <Play className="h-4 w-4 mr-2" />
          Run Script
        </Button>
      </div>
    </div>
  );
}
