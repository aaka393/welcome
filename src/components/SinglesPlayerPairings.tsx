//SinglesPlayerPairings.tsx
import React, { useState, useEffect, useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import { ColDef, GridApi, GridReadyEvent } from "ag-grid-community";
import { Match, MatchSetup, PlayerPairing, Member } from "../types/index";
import { matchSetupService } from "../services/matchSetupService";
import {
  Users,
  Shuffle,
  Save,
  MapPin,
  Target,
  AlertCircle,
  Download,
  RotateCcw,
  X,
  Plus,
} from "lucide-react";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { useMatchSetupStore } from "../stores/useMatchSetupStore";
import {
  extractDateTimeFromBackendFormat,
  formatDateTimeForDisplay,
  getDateTimeStringFromFrontendDateAndTime,
  dateToBackendTimestamp,
} from "../utils/date-utils";
import { testId } from "../utils/testId";

interface SinglesPlayerPairingsProps {
  match: Match;
  matchSetup: MatchSetup | null;
  pairings: PlayerPairing[];
  members: Member[];
  onUpdate: () => void;
}

interface PairingGridRow {
  id: string;
  dateTime: string;
  displayDateTime: string;
  hole: number;
  holeLabel: string;
  player1?: Member;
  player2?: Member;
  player3?: Member;
  player4?: Member;
}

export const SinglesPlayerPairings: React.FC<SinglesPlayerPairingsProps> = ({
  match,
  matchSetup,
  pairings,
  members,
  onUpdate,
}) => {
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [loading, setLoading] = useState(false);
  const [gridData, setGridData] = useState<PairingGridRow[]>([]);
  const [pendingChanges, setPendingChanges] = useState<Map<string, any>>(
    new Map()
  );
  const [showAddHoles, setShowAddHoles] = useState(false);
  const [newDate, setNewDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [newTime, setNewTime] = useState<string>("08:00");
  const [newHoleLabel, setNewHoleLabel] = useState<string>("");
  const [editMode, setEditMode] = useState<boolean>(false);

  // Read-only cell renderers for non-edit mode
  const LabelCellRenderer = (params: any) => {
    const { value, data, colDef } = params;
    if (colDef.field === "displayDateTime")
      return <span {...testId(`pairing-datetime-label-${data.id}`)}>{data.displayDateTime}</span>;
    if (colDef.field === "hole") return <span {...testId(`pairing-hole-number-label-${data.id}`)}>{data.hole}</span>;
    if (colDef.field === "holeLabel") return <span {...testId(`pairing-hole-label-label-${data.id}`)}>{data.holeLabel}</span>;
    if (["player1", "player2", "player3", "player4"].includes(colDef.field)) {
      return <span {...testId(`pairing-${colDef.field}-label-${data.id}`)}>{value ? value.name : ""}</span>;
    }
    return <span>{value}</span>;
  };

  const selPlayerIds = new Set(
    (matchSetup?.selectedPlayers || []).map((p) => p.id)
  );
  const selectedPlayers = members
    .filter((member) => selPlayerIds.has(member.id))
    .map((member) => {
      const p = matchSetup?.selectedPlayers.find(
        (player) => player.id === member.id
      );
      return {
        ...member,
        tournamentHandicap: p?.tournamentHandicap || 0,
      };
    });

  // Initialize grid with default 18 holes
  const initializeGrid = useCallback(() => {
    // If there are pairings, use all of them for the grid (not just 18)
    if (pairings && pairings.length > 0) {
      const initialData: PairingGridRow[] = pairings.map((pairing, idx) => ({
        id: pairing.id || `pairing-${idx + 1}`,
        dateTime: pairing.dateTime,
        displayDateTime:
          pairing.displayDateTime || formatDateTimeForDisplay(pairing.dateTime),
        hole: pairing.holeNumber,
        holeLabel: pairing.holeLabel || pairing.holeNumber.toString(),
        player1: pairing.selectedPlayers[0],
        player2: pairing.selectedPlayers[1],
        player3: pairing.selectedPlayers[2],
        player4: pairing.selectedPlayers[3],
      }));
      setGridData(initialData);
    } else {
      // Default to 18 holes if no pairings
      const defaultDateTime = getDateTimeStringFromFrontendDateAndTime(
        new Date().toISOString().split("T")[0],
        "08:00"
      );
      const initialData: PairingGridRow[] = Array.from(
        { length: 18 },
        (_, i) => {
          const hole = i + 1;
          return {
            id: `default-${hole}`,
            dateTime: defaultDateTime,
            displayDateTime: formatDateTimeForDisplay(defaultDateTime),
            hole,
            holeLabel: hole.toString(),
            player1: undefined,
            player2: undefined,
            player3: undefined,
            player4: undefined,
          };
        }
      );
      setGridData(initialData);
    }
    setPendingChanges(new Map());
  }, [pairings]);

  useEffect(() => {
    initializeGrid();
  }, [initializeGrid]);

  const onGridReady = (params: GridReadyEvent) => {
    setGridApi(params.api);
  };

  // Get all assigned players across all rows
  const getAllAssignedPlayers = (): Set<string> => {
    const assignedPlayerIds = new Set<string>();

    // Check current grid data
    gridData.forEach((row) => {
      [row.player1, row.player2, row.player3, row.player4].forEach((player) => {
        if (player) {
          assignedPlayerIds.add(player.id);
        }
      });
    });

    // Check pending changes
    pendingChanges.forEach((value, key) => {
      if (key.includes("-player") && value) {
        assignedPlayerIds.add(value.id);
      }
    });

    return assignedPlayerIds;
  };

  // Clear button cell renderer
  const ClearButtonCellRenderer = (params: any) => {
    const handleClear = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      const rowId = params.data.id;

      // Clear all players in this row
      ["player1", "player2", "player3", "player4"].forEach((playerField) => {
        const key = `${rowId}-${playerField}`;
        setPendingChanges((prev) => {
          const newMap = new Map(prev);
          newMap.set(key, null);
          return newMap;
        });
      });

      // Update grid data immediately
      setGridData((prevData) =>
        prevData.map((row) =>
          row.id === rowId
            ? {
              ...row,
              player1: undefined,
              player2: undefined,
              player3: undefined,
              player4: undefined,
            }
            : row
        )
      );

      // Force refresh of all dropdowns
      if (gridApi) {
        setTimeout(() => {
          gridApi.refreshCells();
        }, 0);
      }
    };

    return (
      <div className="flex items-center justify-center h-full">
        <button
          onClick={handleClear}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
          style={{ pointerEvents: 'auto' }}
          title="Clear all players in this hole"
          {...testId(`clear-pairing-button-${params.data.id}`)}
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  };

  // Editable Date/Time cell renderer
  const DateTimeCellRenderer = (params: any) => {
    const { data, value } = params;

    const handleDateTimeChange = (newDateTime: string, e?: React.ChangeEvent) => {
      if (e) {
        e.stopPropagation();
      }
      
      const key = `${data.id}-dateTime`;
      const displayDateTime = formatDateTimeForDisplay(newDateTime);

      setPendingChanges(
        (prev) =>
          new Map(prev.set(key, { dateTime: newDateTime, displayDateTime }))
      );

      // Update grid data immediately
      setGridData((prevData) =>
        prevData.map((row) =>
          row.id === data.id
            ? { ...row, dateTime: newDateTime, displayDateTime }
            : row
        )
      );

      params.setValue(displayDateTime);
    };

    // Extract date and time from current dateTime
    const { date, time } = extractDateTimeFromBackendFormat(data.dateTime);

    return (
      <div className="flex flex-col space-y-1 p-1">
        <input
          type="date"
          value={date}
          onChange={(e) => {
            e.stopPropagation();
            const newDateTime = getDateTimeStringFromFrontendDateAndTime(
              e.target.value,
              time
            );
            handleDateTimeChange(newDateTime, e);
          }}
          className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          style={{ fontSize: "10px", padding: "2px" }}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          {...testId(`pairing-date-input-${data.id}`)}
        />
        <input
          type="time"
          value={time}
          onChange={(e) => {
            e.stopPropagation();
            const newDateTime = getDateTimeStringFromFrontendDateAndTime(
              date,
              e.target.value
            );
            handleDateTimeChange(newDateTime, e);
          }}
          className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          style={{ fontSize: "10px", padding: "2px" }}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          {...testId(`pairing-time-input-${data.id}`)}
        />
      </div>
    );
  };

  // Hole number cell renderer
  const HoleCellRenderer = (params: any) => {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-green-100 dark:bg-green-900 px-2 py-1 rounded-full">
          <span className="font-bold text-green-800 dark:text-green-200 text-xs">
            {params.data.hole}
          </span>
        </div>
      </div>
    );
  };

  // Hole label cell renderer (editable)
  const HoleLabelCellRenderer = (params: any) => {
    const { data, value } = params;

    const handleLabelChange = (newLabel: string, e?: React.ChangeEvent) => {
      if (e) {
        e.stopPropagation();
      }
      
      const key = `${data.id}-holeLabel`;
      setPendingChanges((prev) => new Map(prev.set(key, newLabel)));

      // Update grid data immediately
      setGridData((prevData) =>
        prevData.map((row) =>
          row.id === data.id ? { ...row, holeLabel: newLabel } : row
        )
      );

      params.setValue(newLabel);
    };

    return (
      <div className="w-full h-full flex items-center p-1">
        <input
          type="text"
          value={value || data.hole.toString()}
          onChange={(e) => {
            e.stopPropagation();
            handleLabelChange(e.target.value, e);
          }}
          className="w-full text-xs text-center border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-bold"
          style={{ fontSize: "11px", padding: "4px" }}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          placeholder={data.hole.toString()}
          {...testId(`hole-label-input-${data.id}`)}
        />
      </div>
    );
  };

  // Player dropdown cell renderer
  const PlayerDropdownCellRenderer = (params: any) => {
    const { colDef, data, value } = params;
    const playerPosition = colDef.field as
      | "player1"
      | "player2"
      | "player3"
      | "player4";

    const allAssignedPlayers = getAllAssignedPlayers();

    // Filter available players (not assigned anywhere, except current selection)
    const availablePlayers = selectedPlayers.filter(
      (player) => !allAssignedPlayers.has(player.id) || player.id === value?.id
    );

    const handlePlayerChange = (playerId: string) => {
      const selectedPlayer = playerId
        ? selectedPlayers.find((p) => p.id === playerId)
        : null;
      const key = `${data.id}-${playerPosition}`;

      if (selectedPlayer) {
        setPendingChanges((prev) => new Map(prev.set(key, selectedPlayer)));
        params.setValue(selectedPlayer);

        // Update grid data immediately for real-time filtering
        setGridData((prevData) =>
          prevData.map((row) =>
            row.id === data.id
              ? { ...row, [playerPosition]: selectedPlayer }
              : row
          )
        );
      } else if (playerId === "") {
        // Player deselected
        setPendingChanges((prev) => {
          const newMap = new Map(prev);
          newMap.set(key, null);
          return newMap;
        });
        params.setValue(null);

        // Update grid data immediately
        setGridData((prevData) =>
          prevData.map((row) =>
            row.id === data.id ? { ...row, [playerPosition]: undefined } : row
          )
        );
      }

      // Force refresh of all dropdowns to update available options
      if (gridApi) {
        setTimeout(() => {
          gridApi.refreshCells();
        }, 0);
      }
    };

    const formatPlayerOption = (player: Member) => {
      const age = player.age || "N/A";
      const sex = player.sex || "N/A";
      return `${player.mid} ${player.name} (HCP: ${player.tournamentHandicap}, Age: ${age}, ${sex})`;
    };

    return (
      <div className="w-full h-full flex items-center p-1">
        <select
          value={value?.id || ""}
          onChange={(e) => {
            e.stopPropagation();
            handlePlayerChange(e.target.value);
          }}
          className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          style={{ fontSize: "10px", padding: "2px" }}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          {...testId(`player-dropdown-${data.id}-${playerPosition}`)}
        >
          <option value="">Select Player</option>
          {availablePlayers.map((player) => (
            <option key={player.id} value={player.id}>
              {formatPlayerOption(player)}
            </option>
          ))}
        </select>
      </div>
    );
  };

  const columnDefs: ColDef[] = [
    {
      headerName: "Actions",
      width: 70,
      pinned: "left",
      cellRenderer: editMode ? ClearButtonCellRenderer : undefined,
      sortable: false,
      filter: false,
      resizable: false,
      cellStyle: { 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        pointerEvents: 'auto'
      },
    },
    {
      field: "displayDateTime",
      headerName: "Date & Time",
      width: 140,
      pinned: "left",
      cellRenderer: editMode ? DateTimeCellRenderer : LabelCellRenderer,
      sortable: true,
      filter: true,
      resizable: false,
      editable: false,
      cellStyle: { pointerEvents: 'auto' },
    },
    {
      field: "hole",
      headerName: "Hole #",
      width: 80,
      pinned: "left",
      cellRenderer: editMode ? HoleCellRenderer : LabelCellRenderer,
      sortable: true,
      filter: true,
      resizable: false,
      cellStyle: { pointerEvents: 'auto' },
    },
    {
      field: "holeLabel",
      headerName: "Hole Label",
      width: 90,
      pinned: "left",
      cellRenderer: editMode ? HoleLabelCellRenderer : LabelCellRenderer,
      sortable: true,
      filter: true,
      resizable: false,
      editable: false,
      cellStyle: { pointerEvents: 'auto' },
    },
    {
      field: "player1",
      headerName: "Player 1",
      flex: 1,
      minWidth: 180,
      cellRenderer: editMode ? PlayerDropdownCellRenderer : LabelCellRenderer,
      sortable: false,
      filter: false,
      editable: false,
      valueFormatter: (params) => (params.value ? params.value.name : ""),
      cellStyle: { pointerEvents: 'auto' },
    },
    {
      field: "player2",
      headerName: "Player 2",
      flex: 1,
      minWidth: 180,
      cellRenderer: editMode ? PlayerDropdownCellRenderer : LabelCellRenderer,
      sortable: false,
      filter: false,
      editable: false,
      valueFormatter: (params) => (params.value ? params.value.name : ""),
      cellStyle: { pointerEvents: 'auto' },
    },
    {
      field: "player3",
      headerName: "Player 3",
      flex: 1,
      minWidth: 180,
      cellRenderer: editMode ? PlayerDropdownCellRenderer : LabelCellRenderer,
      sortable: false,
      filter: false,
      editable: false,
      valueFormatter: (params) => (params.value ? params.value.name : ""),
      cellStyle: { pointerEvents: 'auto' },
    },
    {
      field: "player4",
      headerName: "Player 4",
      flex: 1,
      minWidth: 180,
      cellRenderer: editMode ? PlayerDropdownCellRenderer : LabelCellRenderer,
      sortable: false,
      filter: false,
      editable: false,
      valueFormatter: (params) => (params.value ? params.value.name : ""),
      cellStyle: { pointerEvents: 'auto' },
    },
  ];

  const handleGenerateAutoPairings = async () => {
    if (selectedPlayers.length === 0) return;

    if (
      !window.confirm(
        "This will re-do ALL hole assignments and overwrite any existing pairings. Continue?"
      )
    ) {
      return;
    }

    try {
      setLoading(true);

      // 1. Get already assigned player IDs from pairings
      const assignedPlayerIds = new Set<string>();
      pairings?.forEach((p) => {
        p.selectedPlayers?.forEach((pl) => assignedPlayerIds.add(pl.id));
      });

      // 2. Get available players
      const availablePlayers = selectedPlayers.filter(
        (p) => !assignedPlayerIds.has(p.id)
      );

      // 3. Prepare hole assignment logic
      const playersPerHole = match.playersPerHole || 4;
      const holesPerSet = 18;
      const baseDate = new Date();
      baseDate.setHours(8, 0, 0, 0); // Start at 8:00 AM
      const holeSets: {
        dateTime: string;
        displayDateTime: string;
        hole: number;
        holeLabel: string;
        players: any[];
      }[] = [];

      // Helper to get hole label suffix (A, B, C, ...)
      const getHoleLabelSuffix = (index: number) => {
        if (index === 0) return "";
        return String.fromCharCode(65 + index - 1); // 0: '', 1: 'A', 2: 'B', ...
      };

      let playerIdx = 0;
      let setIdx = 0;
      let totalPlayers = availablePlayers.length;
      let holeIdCounter = 1;

      while (playerIdx < totalPlayers) {
        // For each set of 18 holes
        for (
          let holeNum = 1;
          holeNum <= holesPerSet && playerIdx < totalPlayers;
          holeNum++
        ) {
          const playersForHole = availablePlayers.slice(
            playerIdx,
            playerIdx + playersPerHole
          );
          // If less than 4 players left, assign whatever is left
          if (playersForHole.length === 0) break;

          // Calculate date/time for this set
          const setDate = new Date(
            baseDate.getTime() + setIdx * 4 * 60 * 60 * 1000
          ); // 4hr gap per set
          const dateTime = dateToBackendTimestamp(setDate);
          const displayDateTime = formatDateTimeForDisplay(dateTime);
          const holeLabel = `${holeNum}${getHoleLabelSuffix(setIdx)}`;

          holeSets.push({
            dateTime,
            displayDateTime,
            hole: holeNum,
            holeLabel,
            players: playersForHole,
          });
          playerIdx += playersPerHole;
          holeIdCounter++;
        }
        setIdx++;
      }

      // 4. Update gridData with new pairings
      const newGridData: PairingGridRow[] = holeSets.map((h, i) => ({
        id: `auto-${i + 1}`,
        dateTime: h.dateTime,
        displayDateTime: h.displayDateTime,
        hole: h.hole,
        holeLabel: h.holeLabel,
        player1: h.players[0],
        player2: h.players[1],
        player3: h.players[2],
        player4: h.players[3],
      }));

      setGridData(newGridData);
      setPendingChanges(new Map());

      // Save new pairings to server
      await useMatchSetupStore.getState().createBulkPairing(
        newGridData.map((row) => ({
          matchId: match.id,
          dateTime: row.dateTime,
          displayDateTime: row.displayDateTime,
          holeNumber: row.hole,
          holeLabel: row.holeLabel,
          selectedPlayers: [
            row.player1,
            row.player2,
            row.player3,
            row.player4,
          ].filter(Boolean) as Member[],
        }))
      );

      onUpdate();
    } catch (error) {
      console.error("Failed to generate pairings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    if (pendingChanges.size === 0) return;

    try {
      setLoading(true);

      // Group changes by row
      const rowChanges = new Map<string, Partial<PairingGridRow>>();

      pendingChanges.forEach((value, key) => {
        const [rowId, field] = key.split(/-(?=[^-]+$)/);

        if (!rowChanges.has(rowId)) {
          const originalRow = gridData.find((row) => row.id === rowId);
          if (originalRow) {
            rowChanges.set(rowId, { ...originalRow });
          }
        }

        const rowData = rowChanges.get(rowId)!;

        if (field === "dateTime") {
          rowData.dateTime = value.dateTime;
          rowData.displayDateTime = value.displayDateTime;
        } else if (field === "holeLabel") {
          rowData.holeLabel = value;
        } else if (field.startsWith("player")) {
          rowData[field as keyof PairingGridRow] = value;
        }
      });

      // Save each row's pairing
      for (const [rowId, changes] of rowChanges) {
        const originalRow = gridData.find((row) => row.id === rowId);
        if (!originalRow) continue;

        const updatedRow = { ...originalRow, ...changes };

        const players = [
          updatedRow.player1,
          updatedRow.player2,
          updatedRow.player3,
          updatedRow.player4,
        ].filter(Boolean) as Member[];

        // Find existing pairing or create new one
        const existingPairing = pairings?.find(
          (p) =>
            p.holeLabel === updatedRow.holeLabel &&
            p.dateTime === updatedRow.dateTime
        );

        if (existingPairing) {
          await useMatchSetupStore
            .getState()
            .updatePairing(existingPairing.id, {
              id: existingPairing.id,
              matchId: match.id,
              dateTime: updatedRow.dateTime,
              displayDateTime: updatedRow.displayDateTime,
              holeNumber: updatedRow.hole,
              holeLabel: updatedRow.holeLabel,
              selectedPlayers: players,
            });
        } else {
          await useMatchSetupStore.getState().createPairing({
            matchId: match.id,
            dateTime: updatedRow.dateTime,
            displayDateTime: updatedRow.displayDateTime,
            holeNumber: updatedRow.hole,
            holeLabel: updatedRow.holeLabel,
            selectedPlayers: players,
          });
        }
      }

      setPendingChanges(new Map());
      initializeGrid();
      onUpdate();
    } catch (error) {
      console.error("Failed to save pairings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChanges = () => {
    setPendingChanges(new Map());
    initializeGrid(); // Reload original data
  };

  const handleClearAllPairings = async () => {
    if (
      window.confirm("Are you sure you want to clear ALL player assignments?")
    ) {
      try {
        setLoading(true);

        // Delete all existing pairings
        for (const pairing of pairings) {
          await matchSetupService.deletePairing(pairing.id);
        }

        setPendingChanges(new Map());
        initializeGrid();
        onUpdate();
      } catch (error) {
        console.error("Failed to clear pairings:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGenerateHoles = async () => {
    if (!newDate.trim() || !newTime.trim() || !newHoleLabel.trim()) {
      alert("Please fill in all fields (Date, Time, and Hole Label)");
      return;
    }

    try {
      setLoading(true);

      const dateTime = getDateTimeStringFromFrontendDateAndTime(
        newDate,
        newTime
      );
      const displayDateTime = formatDateTimeForDisplay(dateTime);

      // Generate 18 new holes with the specified date/time and label
      const newHoles: PairingGridRow[] = Array.from({ length: 18 }, (_, i) => {
        const hole = i + 1;
        const holeLabel = `${hole}${newHoleLabel}`;

        return {
          id: `generated-${Date.now()}-${holeLabel}`,
          dateTime,
          displayDateTime,
          hole,
          holeLabel,
          player1: undefined,
          player2: undefined,
          player3: undefined,
          player4: undefined,
        };
      });

      // Add new holes to existing grid data
      setGridData((prevData) => [...prevData, ...newHoles]);

      // Reset form
      setNewDate(new Date().toISOString().split("T")[0]);
      setNewTime("08:00");
      setNewHoleLabel("");
      setShowAddHoles(false);

      if (gridApi) {
        setTimeout(() => {
          gridApi.refreshCells();
        }, 0);
      }
    } catch (error) {
      console.error("Failed to generate holes:", error);
    } finally {
      setLoading(false);
    }
  };
  const getAssignedPlayersCount = () => {
    const assignedPlayerIds = new Set<string>();
    gridData.forEach((row) => {
      [row.player1, row.player2, row.player3, row.player4].forEach((player) => {
        if (player) assignedPlayerIds.add(player.id);
      });
    });
    return assignedPlayerIds.size;
  };

  const handleExportPairings = () => {
    try {
      // Create headers for the CSV
      const csvHeaders = [
        "Hole #",
        "Hole Label",
        "Date & Time",
        "Player 1 MID",
        "Player 1 Name",
        "Player 1 Handicap",
        "Player 2 MID",
        "Player 2 Name",
        "Player 2 Handicap",
        "Player 3 MID",
        "Player 3 Name",
        "Player 3 Handicap",
        "Player 4 MID",
        "Player 4 Name",
        "Player 4 Handicap"
      ].join(",");

      // Map grid data to CSV rows
      const csvRows = gridData.map(row => {
        return [
          row.hole,
          `"${row.holeLabel}"`,
          `"${row.displayDateTime}"`,
          row.player1 ? row.player1.mid : "",
          `"${row.player1 ? row.player1.name : ""}"`,
          row.player1 ? row.player1.tournamentHandicap || row.player1.handicap || "" : "",
          row.player2 ? row.player2.mid : "",
          `"${row.player2 ? row.player2.name : ""}"`,
          row.player2 ? row.player2.tournamentHandicap || row.player2.handicap || "" : "",
          row.player3 ? row.player3.mid : "",
          `"${row.player3 ? row.player3.name : ""}"`,
          row.player3 ? row.player3.tournamentHandicap || row.player3.handicap || "" : "",
          row.player4 ? row.player4.mid : "",
          `"${row.player4 ? row.player4.name : ""}"`,
          row.player4 ? row.player4.tournamentHandicap || row.player4.handicap || "" : ""
        ].join(",");
      });

      // Create and download CSV file
      const csvContent = [csvHeaders, ...csvRows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `singles_pairings_${match.name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();

      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error("Failed to export pairings:", error);
      alert("Failed to export pairings. Please try again.");
    }
  };

  if (selectedPlayers.length === 0) {
    return (
      <div className="text-center py-12" {...testId('no-players-selected-message-container')}>
        <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2" {...testId('no-players-selected-heading')}>
          No Players Selected
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6" {...testId('no-players-selected-text')}>
          Please select players first before creating pairings.
        </p>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-w-md mx-auto" {...testId('player-selection-guidance')}>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Go to the <strong>Player Selection</strong> tab to choose
            participants.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" {...testId('player-pairings-main-container')}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0" {...testId('pairings-header')}>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white" {...testId('pairings-title')}>
            Singles Tournament Pairings for {match.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Assign players to holes with editable date/time per row (max{" "}
            {match.playersPerHole} per hole)
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4" {...testId('summary-stats-container')}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center space-x-2" {...testId('available-players-stat')}>
            <Users className="h-4 w-4 text-green-500" />
            <span className="text-gray-600 dark:text-gray-400">Available:</span>
            <span className="font-medium text-gray-900 dark:text-white" {...testId('available-players-count')}>
              {selectedPlayers.length}
            </span>
          </div>
          <div className="flex items-center space-x-2" {...testId('assigned-players-stat')}>
            <Target className="h-4 w-4 text-purple-500" />
            <span className="text-gray-600 dark:text-gray-400">Assigned:</span>
            <span className="font-medium text-gray-900 dark:text-white" {...testId('assigned-players-count')}>
              {getAssignedPlayersCount()}
            </span>
          </div>
          <div className="flex items-center space-x-2" {...testId('total-holes-stat')}>
            <MapPin className="h-4 w-4 text-orange-500" />
            <span className="text-gray-600 dark:text-gray-400">
              Total Holes:
            </span>
            <span className="font-medium text-gray-900 dark:text-white" {...testId('total-holes-count')}>
              {gridData.length}
            </span>
          </div>
          <div className="flex items-center space-x-2" {...testId('pending-changes-stat')}>
            <span className="text-gray-600 dark:text-gray-400">Changes:</span>
            <span className="font-medium text-gray-900 dark:text-white" {...testId('pending-changes-count')}>
              {pendingChanges.size}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2" {...testId('action-buttons-container')}>
        <button
          onClick={() => setShowAddHoles(true)}
          className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors text-sm"
          disabled={loading}
          {...testId('generate-holes-button')}
        >
          <Plus className="h-4 w-4" />
          <span>Generate Holes</span>
        </button>

        <button
          onClick={handleGenerateAutoPairings}
          disabled={loading}
          className="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors text-sm"
          {...testId('auto-generate-button')}
        >
          <Shuffle className="h-4 w-4" />
          <span>{loading ? "Generating..." : "Auto Generate"}</span>
        </button>

        <button
          onClick={handleClearAllPairings}
          disabled={loading}
          className="flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors text-sm"
          {...testId('clear-all-button')}
        >
          <RotateCcw className="h-4 w-4" />
          <span>Clear All</span>
        </button>

        <button
          className="flex items-center space-x-2 px-3 py-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors text-sm"
          title="Export Pairings"
          onClick={handleExportPairings}
          {...testId('export-pairings-button')}
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>

      {/* Generate Holes Section */}
      {showAddHoles && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6" {...testId('add-holes-section')}>
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white" {...testId('add-holes-heading')}>
              Generate 18 New Holes
            </h4>
            <button
              onClick={() => setShowAddHoles(false)}
              className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              {...testId('close-add-holes-button')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4" {...testId('add-holes-form')}>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" {...testId('date-label')}>
                Date
              </label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                {...testId('new-hole-date-input')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" {...testId('tee-time-label')}>
                Tee Time
              </label>
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                {...testId('new-hole-time-input')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" {...testId('hole-suffix-label')}>
                Hole Label Suffix
              </label>
              <input
                type="text"
                value={newHoleLabel}
                onChange={(e) => setNewHoleLabel(e.target.value)}
                placeholder="e.g., A, B, -PM"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                {...testId('new-hole-suffix-input')}
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleGenerateHoles}
                disabled={
                  loading ||
                  !newDate.trim() ||
                  !newTime.trim() ||
                  !newHoleLabel.trim()
                }
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors font-medium"
                {...testId('generate-18-holes-button')}
              >
                {loading ? "Generating..." : "Generate 18 Holes"}
              </button>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3" {...testId('hole-preview-text')}>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Preview:</strong> This will create holes labeled as:
              <span className="font-mono ml-1">
                1{newHoleLabel}, 2{newHoleLabel}, 3{newHoleLabel}... 18
                {newHoleLabel}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Pending Changes Controls */}
      {pendingChanges.size > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4" {...testId('pending-changes-banner')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <span className="text-amber-800 dark:text-amber-200 font-medium" {...testId('pending-changes-count')}>
                {pendingChanges.size} unsaved changes
              </span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleSaveChanges}
                disabled={loading}
                className="flex items-center space-x-1 px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded text-sm transition-colors"
                {...testId('save-changes-button')}
              >
                <Save className="h-3 w-3" />
                <span>Save Changes</span>
              </button>
              <button
                onClick={handleClearChanges}
                className="flex items-center space-x-1 px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors"
                {...testId('reset-changes-button')}
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AG Grid + Edit Mode Toggle */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow" {...testId('player-assignments-section')}>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h5 className="font-semibold text-gray-900 dark:text-white" {...testId('player-assignments-heading')}>
            Player Assignments
          </h5>
          <div className="flex items-center gap-2 mt-2 md:mt-0">
            <label className="flex items-center cursor-pointer select-none" {...testId('edit-mode-toggle-label')}>
              <input
                type="checkbox"
                checked={editMode}
                onChange={() => setEditMode((v) => !v)}
                className="form-checkbox h-4 w-4 text-green-600 transition duration-150 ease-in-out"
                {...testId('edit-mode-checkbox')}
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-200 font-medium" {...testId('edit-mode-label-text')}>
                Edit Mode
              </span>
            </label>
          </div>
        </div>
        <div
          className={`$
            isDarkMode ? "ag-theme-alpine-dark" : "ag-theme-alpine"
          }`}
          style={{ height: "700px", width: "100%" }}
          {...testId('ag-grid-container')}
        >
          <AgGridReact
            columnDefs={columnDefs}
            rowData={gridData}
            onGridReady={onGridReady}
            domLayout="normal"
            animateRows={true}
            suppressCellFocus={false}
            defaultColDef={{
              resizable: true,
              suppressMovable: true,
              cellStyle: { pointerEvents: 'auto' },
            }}
            suppressRowClickSelection={true}
            suppressCellSelection={true}
            enableCellTextSelection={false}
            suppressColumnVirtualisation={false}
            rowHeight={60}
            headerHeight={40}
            {...testId('ag-grid-react-component')}
          />
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4" {...testId('instructions-section')}>
        <h4 className="font-medium text-gray-900 dark:text-white mb-2" {...testId('instructions-heading')}>
          Singles Tournament Instructions:
        </h4>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li {...testId('instruction-item-1')}>• Each row represents one hole with editable date and time</li>
          <li {...testId('instruction-item-2')}>• Edit date/time directly in each row for flexible scheduling</li>
          <li {...testId('instruction-item-3')}>
            • Edit hole labels to customize naming (e.g., 1A, 1B for multiple
            rounds)
          </li>
          <li {...testId('instruction-item-4')}>• Each player can only be assigned once across all holes</li>
          <li {...testId('instruction-item-5')}>
            • Use dropdowns to select players with handicap, age, and gender
            info
          </li>
          <li {...testId('instruction-item-6')}>
            • Click the X button to clear all players from a specific hole
          </li>
          <li {...testId('instruction-item-7')}>• "Auto Generate" creates balanced random pairings</li>
          <li {...testId('instruction-item-8')}>• Save changes to persist your assignments</li>
          <li {...testId('instruction-item-9')}>• Perfect for tournaments extending over multiple days</li>
        </ul>
      </div>
    </div>
  );
};

export default SinglesPlayerPairings;
