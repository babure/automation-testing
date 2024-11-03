import DataTable from "@/utility/Datatable";
import EnhancedEditableTable from "@/utility/TestScriptDatatable";
import React, { useEffect, useState } from "react";

export default function TestScripts({
  activeSecondaryTab,
  initialColumnOrder,
  defaultHiddenColumns,
  defaultFilters,
}) {
  const [testScript, setTestScript] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch data from Chrome local storage
  const getHarvestedData = () => {
    setLoading(true);
    chrome.storage.local.get("trackedElements", (result) => {
      const elements = result.trackedElements || [];
      setTestScript(elements);
      setLoading(false);
    });
  };

  useEffect(() => {
    if (activeSecondaryTab === "Test Script") {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: "toggleTracking",
          shouldTrack: true,
        });
      });
    } else {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: "toggleTracking",
          shouldTrack: false,
        });
      });
    }
  }, [activeSecondaryTab]);

  useEffect(() => {
    getHarvestedData();
    chrome.runtime.onMessage.addListener((request) => {
      if (request.type === "elementDetails") {
        getHarvestedData();
      }
    });
    return () => {
      chrome.runtime.onMessage.removeListener();
    };
  }, []);

  // Refresh: Fetch data from Chrome local storage
  const handleRefresh = () => getHarvestedData();

  // Edit: Update a specific item in Chrome local storage
  const handleEdit = (rowIndex, column, newValue) => {
    const updatedData = [...testScript];
    updatedData[rowIndex][column] = newValue;
    setTestScript(updatedData);

    // Update local storage
    chrome.storage.local.set({ trackedElements: updatedData }, () => {
      console.log("Local storage updated after edit");
    });
  };

  // Save edited value to local storage
  const handleSave = (rowIndex, column, value) => {
    const newData = [...testScript];
    newData[rowIndex][column] = value;
    setTestScript(newData);

    chrome.storage.local.set({ trackedElements: newData }, () => {
      console.log("Local storage updated after save");
    });
  };

  // Delete a single row from Chrome local storage
  const handleDeleteRow = (rowIndex) => {
    const updatedData = testScript.filter((_, index) => index !== rowIndex);
    setTestScript(updatedData);

    // Update local storage
    chrome.storage.local.set({ trackedElements: updatedData }, () => {
      console.log("Local storage updated after row deletion");
    });
  };

  // Delete All: Clear the Chrome local storage
  const handleDeleteAll = () => {
    setTestScript([]);

    chrome.storage.local.remove("trackedElements", () => {
      console.log("All data deleted from local storage");
    });
  };

  const handleRunScript = () => {
    console.log("Running script...");
  };

  const handleGlobalSearch = (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredData = testScript.filter((item) =>
      Object.values(item).some((val) =>
        val.toString().toLowerCase().includes(searchTerm)
      )
    );
    setTestScript(filteredData);
  };

  const handleClearGlobalSearch = () => getHarvestedData();

  return (
    <>
      {loading ? (
        <div className="flex justify-center items-center">
          <div className="loader">Loading...</div>
        </div>
      ) : (
        <>
          {testScript && (
            <EnhancedEditableTable
              data={testScript}
              visibleColumns={["text", "type", "value"]}
              onRefresh={handleRefresh}
              onEdit={handleEdit}
              onSave={handleSave}
              onCancelEdit={() => console.log("Edit canceled")}
              onDeleteRow={handleDeleteRow}
              onDeleteAll={handleDeleteAll}
              onRunScript={handleRunScript}
              onGlobalSearch={handleGlobalSearch}
              onClearGlobalSearch={handleClearGlobalSearch}
            />
          )}
        </>
      )}
    </>
  );
}
