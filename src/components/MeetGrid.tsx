import React, { useState, useEffect, useCallback, useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import { ColDef, GridApi, GridReadyEvent } from "ag-grid-community";
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  MapPin,
  Calendar,
  Clock,
  Settings,
} from "lucide-react";
import { Meet } from "../types/index"
import { useThemeStore } from "../stores/useThemeStore";
import { useAdminStore } from "../stores/useAdminStore";
import {
  htmlDateToBackendTimestamp,
  backendTimestampToHtmlDate,
  formatBackendTimestampForDisplay,
  getCurrentBackendTimestamp,
} from "../utils/date-utils";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { useCommonDataStore } from "../stores/useCommonDataStore";
import { testId } from "../utils/testId";

const ActionsCellRenderer = React.memo((props: any) => {
  const { onEdit, onDelete, onConfigure } = props.context || {};
  const meetId = props.data?.id;
  
  // Ensure we have the required handlers
  if (!onEdit || !onDelete || !onConfigure || !props.data) {
    return null;
  }

  // Handle button clicks with proper event handling
  const handleConfigure = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onConfigure(props.data);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit(props.data);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(props.data.id);
  };

  return (
    <div className="flex items-center justify-center space-x-2 h-full">
      <button
        data-testid={`configure-meet-button-${meetId}`}
        onClick={handleConfigure}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        className="p-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200 rounded transition-colors cursor-pointer"
        style={{ pointerEvents: 'auto' }}
        title="Configure Meet"
      >
        <Settings className="h-4 w-4" />
      </button>
      <button
        data-testid={`edit-meet-button-${meetId}`}
        onClick={handleEdit}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 rounded transition-colors cursor-pointer"
        style={{ pointerEvents: 'auto' }}
        title="Edit Meet"
      >
        <Edit className="h-4 w-4" />
      </button>
      <button
        data-testid={`delete-meet-button-${meetId}`}
        onClick={handleDelete}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 rounded transition-colors cursor-pointer"
        style={{ pointerEvents: 'auto' }}
        title="Delete Meet"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
});

const StatusCellRenderer = React.memo((props: any) => {
  const isActive = props.value;
  return (
    <div className="flex items-center h-full pl-3">
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          isActive
            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
        }`}
      >
        {isActive ? "Active" : "Inactive"}
      </span>
    </div>
  );
});

const DateRangeCellRenderer = React.memo((props: any) => {
  const startDate = formatBackendTimestampForDisplay(props.data.startDate);
  const endDate = formatBackendTimestampForDisplay(props.data.endDate);
  return (
    <div className="flex items-center h-full pl-3">
      <span className="text-gray-900 dark:text-white">
        {startDate} - {endDate}
      </span>
    </div>
  );
});

const TextCellRenderer = React.memo((props: any) => {
  if (!props.value)
    return (
      <div className="flex items-center h-full pl-3">
        <span className="text-gray-400 italic">-</span>
      </div>
    );
  return (
    <div className="flex items-center h-full pl-3">
      <span className="text-gray-900 dark:text-white">{props.value}</span>
    </div>
  );
});

export const MeetGrid: React.FC = () => {
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMeet, setEditingMeet] = useState<Meet | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const { isDarkMode } = useThemeStore();
  const {
    meets,
    meetsError: error,
    meetsLoading: loading,
    loadMeets,
  } = useCommonDataStore();
  const { 
    setCurrentView, 
    setSelectedMeetId,
    createMeet,
    updateMeet,
    deleteMeet
  } = useAdminStore();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const onGridReady = useCallback((params: GridReadyEvent) => {
    setGridApi(params.api);
    // Auto-size columns after grid is ready
    setTimeout(() => {
      params.api.sizeColumnsToFit();
    }, 100);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      if (window.confirm("Are you sure you want to delete this meet?")) {
        try {
          await deleteMeet(id);
        } catch (error) {
          console.error("Failed to delete meet:", error);
          alert("Failed to delete meet. Please try again.");
        }
      }
    },
    [deleteMeet]
  );

  const handleEdit = useCallback((meet: Meet) => {
    setEditingMeet(meet);
    setShowAddForm(true);
  }, []);

  const handleConfigure = useCallback(
    (meet: Meet) => {
      setSelectedMeetId(meet.id);
      setCurrentView("meet-config");
    },
    [setSelectedMeetId, setCurrentView]
  );

  const handleSave = useCallback(
    async (meetData: Omit<Meet, "id">) => {
      try {
        const processedData = {
          name: meetData.name,
          courseName: meetData.courseName,
          isActive: meetData.isActive,
          handicapPercentage: meetData.handicapPercentage,
          startDate: meetData.startDate
            ? htmlDateToBackendTimestamp(meetData.startDate)
            : "",
          endDate: meetData.endDate
            ? htmlDateToBackendTimestamp(meetData.endDate)
            : getCurrentBackendTimestamp(),
        };
        if (editingMeet) {
          await updateMeet(editingMeet.id, processedData);
        } else {
          await createMeet(processedData);
        }
        setShowAddForm(false);
        setEditingMeet(null);
      } catch (error) {
        console.error("Failed to save meet:", error);
        alert("Failed to save meet. Please try again.");
      }
    },
    [editingMeet, createMeet, updateMeet]
  );

  // Memoize column definitions to prevent recreation
  const columnDefs = useMemo(
    (): ColDef[] => [
      {
        headerName: "Actions",
        cellRenderer: ActionsCellRenderer,
        sortable: false,
        filter: false,
        width: 140,
        minWidth: 140,
        maxWidth: 140,
        pinned: "left",
        resizable: false,
        headerClass: "ag-header-cell-label",
        cellStyle: { 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          pointerEvents: 'auto'
        },
      },
      {
        field: "name",
        headerName: "Meet Name",
        width: 200,
        minWidth: 150,
        sortable: true,
        filter: true,
        cellRenderer: TextCellRenderer,
        headerClass: "ag-header-cell-label",
      },
      {
        field: "courseName",
        headerName: "Course",
        width: 180,
        minWidth: 140,
        sortable: true,
        filter: true,
        cellRenderer: TextCellRenderer,
        headerClass: "ag-header-cell-label",
      },
      {
        field: "dates",
        headerName: "Dates",
        width: 250,
        minWidth: 200,
        sortable: true,
        filter: true,
        cellRenderer: DateRangeCellRenderer,
        headerClass: "ag-header-cell-label",
      },
      {
        field: "handicapPercentage",
        headerName: "Handicap %",
        width: 150,
        minWidth: 120,
        sortable: true,
        filter: true,
        cellRenderer: TextCellRenderer,
        headerClass: "ag-header-cell-label",
      },
      {
        field: "isActive",
        headerName: "Status",
        width: 120,
        minWidth: 100,
        sortable: true,
        filter: true,
        cellRenderer: StatusCellRenderer,
        headerClass: "ag-header-cell-label",
      },
    ],
    []
  );

  // Memoize default column definition
  const defaultColDef = useMemo(
    () => ({
      resizable: true,
      sortable: true,
      filter: true,
      floatingFilter: false,
      headerClass: "ag-header-cell-label",
    }),
    []
  );

  // Memoize grid context
  const gridContext = useMemo(
    () => ({
      onEdit: handleEdit,
      onDelete: handleDelete,
      onConfigure: handleConfigure,
    }),
    [handleEdit, handleDelete, handleConfigure]
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 {...testId("meet-mgmt-title")} className="text-2xl font-bold text-gray-900 dark:text-white">
          Meets Management
        </h2>
        <button
          {...testId("add-meet-button")}
          onClick={() => {
            setEditingMeet(null);
            setShowAddForm(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Meet</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
          <button
            onClick={() => loadMeets(true)}
            className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {showAddForm && (
        <MeetForm
          meet={editingMeet}
          onSave={handleSave}
          onCancel={() => {
            setShowAddForm(false);
            setEditingMeet(null);
          }}
        />
      )}

      {!showAddForm && (
        <>
          {isMobile ? (
            <MeetCards
              meets={meets}
              loading={loading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onConfigure={handleConfigure}
            />
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <style>
                {`
                  .ag-header-cell-label {
                    padding-left: 12px !important;
                    justify-content: flex-start !important;
                  }
                  .ag-header-cell-text {
                    text-align: left !important;
                  }
                  .ag-cell {
                    padding: 0 !important;
                  }
                  .ag-cell-wrapper {
                    padding: 0 !important;
                    width: 100% !important;
                  }
                `}
              </style>
              <div
                {...testId("meet-grid")}
                className={`${
                  isDarkMode ? "ag-theme-alpine-dark" : "ag-theme-alpine"
                } w-full`}
                style={{ height: "600px" }}
              >
                {loading && (
                  <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 flex items-center justify-center z-10">
                    <div className="animate-spin h-8 w-8 border-4 border-green-600 dark:border-green-400 rounded-full border-t-transparent"></div>
                  </div>
                )}
                <AgGridReact
                  columnDefs={columnDefs}
                  rowData={meets}
                  onGridReady={onGridReady}
                  context={gridContext}
                  pagination={false}
                  domLayout="normal"
                  animateRows={true}
                  rowSelection="single"
                  suppressCellFocus={true}
                  defaultColDef={defaultColDef}
                  rowHeight={50}
                  headerHeight={50}
                  suppressMenuHide={true}
                  enableCellTextSelection={true}
                  maintainColumnOrder={true}
                  suppressColumnVirtualisation={true}
                  suppressRowVirtualisation={false}
                  ensureDomOrder={true}
                  getRowId={(params) => params.data.id}
                  suppressRowClickSelection={true}
                  suppressCellSelection={true}
                  getRowStyle={() => ({
                    background: "transparent",
                  })}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

interface MeetCardsProps {
  meets: Meet[];
  loading: boolean;
  onEdit: (meet: Meet) => void;
  onDelete: (id: string) => void;
  onConfigure: (meet: Meet) => void;
}

const MeetCards: React.FC<MeetCardsProps> = ({
  meets,
  loading,
  onEdit,
  onDelete,
  onConfigure,
}) => {
  if (loading) {
    return (
      <div className="grid gap-4">
        {[...Array(3)].map((_, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 animate-pulse"
          >
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
  };

  return (
    <div {...testId("meet-cards-container")} className="grid gap-4">
      {meets.map((meet) => (
        <div
          key={meet.id}
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                {meet.name}
              </h3>
              <div className="flex flex-wrap gap-2 mb-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    meet.isActive
                  )}`}
                >
                  {meet.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
            <div className="flex space-x-2 ml-4">
              <button
                {...testId(`configure-meet-card-button-${meet.id}`)}
                onClick={() => onConfigure(meet)}
                className="p-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                title="Configure Meet"
              >
                <Settings className="h-4 w-4" />
              </button>
              <button
                {...testId(`edit-meet-card-button-${meet.id}`)}
                onClick={() => onEdit(meet)}
                className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                title="Edit Meet"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                {...testId(`delete-meet-card-button-${meet.id}`)}
                onClick={() => onDelete(meet.id)}
                className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Delete Meet"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span>{meet.courseName}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span>
                Start: {formatBackendTimestampForDisplay(meet.startDate)}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span>End: {formatBackendTimestampForDisplay(meet.endDate)}</span>
            </div>
          </div>
        </div>
      ))}
      {meets.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No meets found</p>
        </div>
      )}
    </div>
  );
};

interface MeetFormProps {
  meet: Meet | null;
  onSave: (meet: Omit<Meet, "id">) => void;
  onCancel: () => void;
}

const MeetForm: React.FC<MeetFormProps> = ({ meet, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: meet?.name || "",
    courseName: meet?.courseName || "",
    startDate: meet?.startDate
      ? backendTimestampToHtmlDate(meet.startDate)
      : new Date().toISOString().split("T")[0],
    endDate: meet?.endDate
      ? backendTimestampToHtmlDate(meet.endDate)
      : new Date().toISOString().split("T")[0],
    isActive: meet?.isActive ?? true,
    handicapPercentage: meet?.handicapPercentage || 0.0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData as Omit<Meet, "id">);
  };

  return (
    <div {...testId("meet-form")} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {meet ? "Edit Meet" : "Add New Meet"}
      </h3>

      {formData.isActive && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Note:</strong> Setting this meet as active will
            automatically deactivate all other meets. Only one meet can be
            active at a time.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Meet Name
            </label>
            <input
              {...testId("meet-name-input")}
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
              title="Enter the name of the meet"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Course Name
            </label>
            <input
              {...testId("course-name-input")}
              type="text"
              value={formData.courseName}
              onChange={(e) =>
                setFormData({ ...formData, courseName: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
              title="Enter the name of the course"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start Date
            </label>
            <input
              {...testId("start-date-input")}
              type="date"
              value={formData.startDate}
              onChange={(e) =>
                setFormData({ ...formData, startDate: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
              title="Select the start date of the meet"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End Date
            </label>
            <input
              {...testId("end-date-input")}
              type="date"
              value={formData.endDate}
              onChange={(e) =>
                setFormData({ ...formData, endDate: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
              title="Select the end date of the meet"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Handicap Percentage
            </label>
            <input
              {...testId("handicap-percentage-input")}
              type="number"
              step="0.01"
              value={formData.handicapPercentage}
              onChange={(e) => setFormData({ ...formData, handicapPercentage: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
              title="Enter the handicap percentage"
            />
            </div>


          <div className="md:col-span-2">
            <label {...testId("is-active-checkbox-label")} className="flex items-center space-x-2">
              <input
                {...testId("is-active-checkbox")}
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="rounded border-gray-300 dark:border-gray-600 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Active Meet
              </span>
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            {...testId("cancel-meet-button")}
            type="button"
            onClick={onCancel}
            className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="h-4 w-4" />
            <span>Cancel</span>
          </button>
          <button
            {...testId("save-meet-button")}
            type="submit"
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <Save className="h-4 w-4" />
            <span>Save</span>
          </button>
        </div>
      </form>
    </div>
  );
};