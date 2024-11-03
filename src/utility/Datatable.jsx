"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  X,
  RefreshCw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function DataTable({
  tableData = [],
  handleRowClick,
  onRefresh,
  columnOrder: initialColumnOrder,
  defaultHiddenColumns = [],
  defaultFilters = {},
}) {
  const MAX_VISIBLE_PAGES = 5;
  const [data, setData] = useState(tableData);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });
  const [filters, setFilters] = useState(defaultFilters);
  const [filterSearchTerms, setFilterSearchTerms] = useState({});
  const [globalSearchTerm, setGlobalSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const allColumns = useMemo(
    () => Object.keys(tableData[0] || {}),
    [tableData]
  );
  const [columnOrder, setColumnOrder] = useState(
    initialColumnOrder || allColumns
  );
  const [visibleColumns, setVisibleColumns] = useState(
    columnOrder.filter((col) => !defaultHiddenColumns.includes(col))
  );

  useEffect(() => {
    setData(tableData);
  }, [tableData]);

  // Get unique values for each column
  const uniqueValues = useMemo(() => {
    if (data.length === 0) return {};
    const values = {};
    Object.keys(data[0]).forEach((key) => {
      values[key] = [...new Set(data.map((item) => item[key]))];
    });
    return values;
  }, [data]);

  // Sorting function
  const sortedData = useMemo(() => {
    let sortableItems = [...data];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [data, sortConfig]);

  // Filtering function
  const filteredData = useMemo(() => {
    return sortedData.filter((item) => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value || value.length === 0) return true;
        return value.includes(item[key].toString());
      });
    });
  }, [sortedData, filters]);

  // Global searching function
  const searchedData = useMemo(() => {
    return filteredData.filter((item) =>
      Object.values(item).some((val) =>
        val.toString().toLowerCase().includes(globalSearchTerm.toLowerCase())
      )
    );
  }, [filteredData, globalSearchTerm]);

  // Pagination
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return searchedData.slice(startIndex, startIndex + itemsPerPage);
  }, [searchedData, currentPage, itemsPerPage]);

  const pageCount = Math.ceil(searchedData.length / itemsPerPage);

  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const handleFilterChange = (column, value) => {
    setFilters((prev) => {
      const updatedFilters = { ...prev };
      if (!updatedFilters[column]) {
        updatedFilters[column] = [value];
      } else if (updatedFilters[column].includes(value)) {
        updatedFilters[column] = updatedFilters[column].filter(
          (v) => v !== value
        );
      } else {
        updatedFilters[column] = [...updatedFilters[column], value];
      }
      if (updatedFilters[column].length === 0) {
        delete updatedFilters[column];
      }
      return updatedFilters;
    });
    setCurrentPage(1);
  };

  const handleFilterSearch = (column, searchTerm) => {
    setFilterSearchTerms((prev) => ({ ...prev, [column]: searchTerm }));
  };

  const handleGlobalSearch = (event) => {
    setGlobalSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  const toggleColumnVisibility = (column) => {
    setVisibleColumns((prev) =>
      prev.includes(column)
        ? prev.filter((col) => col !== column)
        : [...columnOrder.filter((col) => prev.includes(col) || col === column)]
    );
  };

  const clearGlobalSearch = () => {
    setGlobalSearchTerm("");
    setCurrentPage(1);
  };

  const clearColumnFilter = (column) => {
    setFilters((prev) => {
      const updatedFilters = { ...prev };
      delete updatedFilters[column];
      return updatedFilters;
    });
    setFilterSearchTerms((prev) => {
      const updatedTerms = { ...prev };
      delete updatedTerms[column];
      return updatedTerms;
    });
    setCurrentPage(1);
  };

  const clearFilterSearchTerm = (column) => {
    setFilterSearchTerms((prev) => {
      const updatedTerms = { ...prev };
      delete updatedTerms[column];
      return updatedTerms;
    });
  };

  if (!data || data.length === 0) {
    return (
      <div className="container mx-auto p-1 space-y-2">
        <div className="text-center py-4">
          <p className="text-gray-500">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-1 space-y-2">
      <div className="flex justify-between items-center">
        <div className="relative w-full max-w-sm">
          <Input
            type="text"
            placeholder="Global Search..."
            value={globalSearchTerm}
            onChange={handleGlobalSearch}
            className="pr-8"
          />
          {globalSearchTerm && (
            <Button
              variant="ghost"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 p-0"
              onClick={clearGlobalSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex items-center space-x-2 ml-1">
          <Button onClick={onRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={handleItemsPerPageChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Items per page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 per page</SelectItem>
              <SelectItem value="15">15 per page</SelectItem>
              <SelectItem value="20">20 per page</SelectItem>
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Columns <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {columnOrder.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column}
                  className="capitalize"
                  checked={visibleColumns.includes(column)}
                  onCheckedChange={() => toggleColumnVisibility(column)}
                >
                  {column}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table
          className="w-full border-collapse table-auto"
          style={{ fontSize: "0.875rem", lineHeight: "1.25rem" }}
        >
          <thead>
            <tr className="bg-gray-100">
              {columnOrder
                .filter((column) => visibleColumns.includes(column))
                .map((column) => (
                  <th
                    key={column}
                    className="p-2 text-left"
                    style={{
                      fontSize: "0.75rem",
                      lineHeight: "1rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => requestSort(column)}
                        className="font-bold text-gray-700 hover:text-gray-900 flex items-center"
                      >
                        {column.charAt(0).toUpperCase() + column.slice(1)}
                        <span className="ml-1 flex">
                          <ArrowUp
                            className={`w-4 h-4 ${
                              sortConfig.key === column &&
                              sortConfig.direction === "ascending"
                                ? "text-blue-500"
                                : "text-gray-400"
                            }`}
                          />
                          <ArrowDown
                            className={`w-4 h-4 ${
                              sortConfig.key === column &&
                              sortConfig.direction === "descending"
                                ? "text-blue-500"
                                : "text-gray-400"
                            }`}
                          />
                        </span>
                      </button>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={`ml-2 p-2 relative ${
                              filters[column] && filters[column].length > 0
                                ? "bg-blue-100 border-blue-300"
                                : ""
                            }`}
                          >
                            <Filter
                              className={`h-4 w-4 ${
                                filters[column] && filters[column].length > 0
                                  ? "text-blue-500"
                                  : ""
                              }`}
                            />
                            {filters[column] && filters[column].length > 0 && (
                              <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                {filters[column].length}
                              </span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <div className="relative w-full">
                                <Input
                                  type="text"
                                  placeholder={`Search ${column}...`}
                                  value={filterSearchTerms[column] || ""}
                                  onChange={(e) =>
                                    handleFilterSearch(column, e.target.value)
                                  }
                                  className="w-full pr-8"
                                />
                                {filterSearchTerms[column] && (
                                  <Button
                                    variant="ghost"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 p-0"
                                    onClick={() =>
                                      clearFilterSearchTerm(column)
                                    }
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                className="ml-2 p-2"
                                onClick={() => clearColumnFilter(column)}
                              >
                                Clear Selected
                              </Button>
                            </div>
                            {uniqueValues[column]
                              .filter((value) =>
                                value
                                  .toString()
                                  .toLowerCase()
                                  .includes(
                                    (
                                      filterSearchTerms[column] || ""
                                    ).toLowerCase()
                                  )
                              )
                              .map((value) =>
                                value !== null ? (
                                  <label
                                    key={value}
                                    className="flex items-center space-x-2"
                                  >
                                    <Checkbox
                                      checked={(filters[column] || []).includes(
                                        value.toString()
                                      )}
                                      onCheckedChange={() =>
                                        handleFilterChange(
                                          column,
                                          value.toString()
                                        )
                                      }
                                    />
                                    <span>{value}</span>
                                  </label>
                                ) : null
                              )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((item, index) => (
              <tr
                key={index}
                className="border-b hover:bg-gray-50 cursor-pointer"
                onClick={() => handleRowClick(item.xpath)}
              >
                {columnOrder
                  .filter((column) => visibleColumns.includes(column))
                  .map((column) => (
                    <td
                      key={column}
                      className="p-2 text-sm text-gray-800"
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: "200px",
                      }}
                    >
                      {item[column]}
                    </td>
                  ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between items-center mt-2">
        <div>
          Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
          {Math.min(currentPage * itemsPerPage, searchedData.length)} of{" "}
          {searchedData.length} entries
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            size="icon"
            variant="outline"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            size="icon"
            variant="outline"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {(() => {
            const pageButtons = [];
            const startPage = Math.max(
              1,
              currentPage - Math.floor(MAX_VISIBLE_PAGES / 2)
            );
            const endPage = Math.min(
              pageCount,
              startPage + MAX_VISIBLE_PAGES - 1
            );

            if (startPage > 1) {
              pageButtons.push(
                <Button
                  key={1}
                  onClick={() => handlePageChange(1)}
                  variant="outline"
                >
                  1
                </Button>
              );
              if (startPage > 2) {
                pageButtons.push(<span key="ellipsis1">...</span>);
              }
            }

            for (let page = startPage; page <= endPage; page++) {
              pageButtons.push(
                <Button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  variant={currentPage === page ? "default" : "outline"}
                >
                  {page}
                </Button>
              );
            }

            if (endPage < pageCount) {
              if (endPage < pageCount - 1) {
                pageButtons.push(<span key="ellipsis2">...</span>);
              }
              pageButtons.push(
                <Button
                  key={pageCount}
                  onClick={() => handlePageChange(pageCount)}
                  variant="outline"
                >
                  {pageCount}
                </Button>
              );
            }

            return pageButtons;
          })()}
          <Button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === pageCount}
            size="icon"
            variant="outline"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => handlePageChange(pageCount)}
            disabled={currentPage === pageCount}
            size="icon"
            variant="outline"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
