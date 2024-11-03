import React, { useEffect, useState } from "react";
import "./App.css";
import "../styles.css";
import HarvestedDataTable from "./components/pages/HarvestedDataTable";
import TestScripts from "./components/pages/TestScripts";

const mainTabs = ["Harvesting"];
const secondaryTabs = {
  Harvesting: [
    "Object Repository",
    "Test Script",
    "Test Management",
    "Settings",
  ],
};

const columnOrder = [
  "id",
  "text",
  "type",
  "visible",
  "value",
  "xpath",
  "cssSelector",
  "classes",
  "name",
  "disabled",
];
const defaultHiddenColumns = [
  "id",
  "disabled",
  "visible",
  "value",
  "cssSelector",
  "classes",
  "name",
  "xpath",
];
const defaultFilters = {};

function App() {
  const [activeMainTab, setActiveMainTab] = useState(mainTabs[0]);
  const [activeSecondaryTab, setActiveSecondaryTab] = useState(
    secondaryTabs[mainTabs[0]][0]
  );
  useEffect(() => {
    chrome.storage.local.remove("trackedElements", () => {
      if (chrome.runtime.lastError) {
        console.error(
          "Error clearing tracked elements:",
          chrome.runtime.lastError
        );
      } else {
        console.log("Tracked elements cleared after refresh.");
      }
    });
  }, []);

  return (
    <>
      <div className="w-full mx-auto p-2">
        <div className="mb-4">
          {/* Main Tabs */}
          <ul className="flex border-b">
            {mainTabs.map((tab) => (
              <li key={tab} className="-mb-px mr-1">
                <button
                  className={`inline-block py-2 px-4 text-sm font-semibold ${
                    activeMainTab === tab
                      ? "text-purple-600 border-b-2 border-purple-600"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                  onClick={() => {
                    setActiveMainTab(tab);
                    setActiveSecondaryTab(secondaryTabs[tab][0]);
                  }}
                >
                  {tab}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Secondary Tabs */}
        <div>
          <ul className="flex mb-4">
            {secondaryTabs[activeMainTab].map((tab) => (
              <li key={tab} className="mr-2">
                <button
                  className={`py-1 px-3 text-sm rounded-full ${
                    activeSecondaryTab === tab
                      ? "bg-gray-200 text-gray-800 font-semibold"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                  onClick={() => setActiveSecondaryTab(tab)}
                >
                  {tab}
                </button>
              </li>
            ))}
          </ul>
        </div>
        {activeSecondaryTab === "Object Repository" && (
          <HarvestedDataTable
            initialColumnOrder={columnOrder}
            defaultHiddenColumns={defaultHiddenColumns}
            defaultFilters={defaultFilters}
          />
        )}
        {activeSecondaryTab === "Test Script" && (
          <TestScripts
            activeSecondaryTab={activeSecondaryTab}
            initialColumnOrder={columnOrder}
            defaultHiddenColumns={defaultHiddenColumns}
            defaultFilters={defaultFilters}
          />
        )}
      </div>
    </>
  );
}

export default App;
