import React, { useEffect, useState } from "react";
import Datatable from "../../utility/Datatable";
import "../../../styles.css";

export default function HarvestedDataTable({
  initialColumnOrder,
  defaultHiddenColumns,
  defaultFilters,
}) {
  const [harvestedData, setHarvestedData] = useState([]);
  const [loading, setLoading] = useState(false);

  const getHarvestedData = () => {
    setLoading(true);
    chrome.storage.local.get("clickableElements", (result) => {
      const elements = result.clickableElements || {};
      setHarvestedData(elements.harvestedData);
      setLoading(false);
    });
  };

  const injectCSS = () => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = chrome.runtime.getURL("styles.css");
    document.head.appendChild(link);
  };

  useEffect(() => {
    getHarvestedData();
    injectCSS();
    chrome.runtime.onMessage.addListener((request) => {
      if (request.type === "dataUpdated") {
        getHarvestedData();
      }
    });
    return () => {
      chrome.runtime.onMessage.removeListener();
    };
  }, []);

  const handleRowClick = (xpath) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { xpath });
    });
  };

  return (
    <>
      {loading ? (
        <div className="flex justify-center items-center">
          <div className="loader">Loading...</div>
        </div>
      ) : (
        <>
          {harvestedData && harvestedData.length > 0 ? (
            <Datatable
              tableData={harvestedData}
              handleRowClick={handleRowClick}
              onRefresh={getHarvestedData}
              initialColumnOrder={initialColumnOrder}
              defaultHiddenColumns={defaultHiddenColumns}
              defaultFilters={defaultFilters}
            />
          ) : (
            <div>No data available.</div>
          )}
        </>
      )}
    </>
  );
}
