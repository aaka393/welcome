//DoublesPlayerPairings.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import { ColDef, GridApi, GridReadyEvent } from "ag-grid-community";
import {
  Match,
  MatchSetup,
  PlayerPairing,
  Member,
  DoublesHoleAssignment,
} from "../types/index";
import { useThemeStore } from "../stores/useThemeStore";
import {
  Users,
  Save,
  MapPin,
  Target,
  AlertCircle,
  Download,
  RotateCcw,
  X,
  Plus,
  UserPlus,
  Trash2,
  ArrowRight,
  Shuffle,
} from "lucide-react";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import {
  backendTimestampToDate,
  dateToBackendTimestamp,
  extractDateTimeFromBackendFormat,
} from "../utils/date-utils";
import { useMatchSetupStore } from "../stores/useMatchSetupStore";
import GridFilter from "./Filter";
import { testId } from "../utils/testId";

const DateCellRenderer = React.memo((props: any) => {
  if (!props.value) return <span className="text-gray-500">-</span>;
  const data = backendTimestampToDate(props.value);
  return (
    <div className="flex items-center h-full pl-3" {...testId("date-cell")}>
      <span className="text-gray-900 dark:text-white">
        {data ? data.toLocaleDateString() : "-"}
      </span>
    </div>
  );
});

const TextCellRenderer = React.memo((props: any) => {
  if (!props.value)
    return (
      <div className="flex items-center h-full pl-3" {...testId("text-cell")}>
        <span className="text-gray-400 italic">-</span>
      </div>
    );
  return (
    <div className="w-full h-full pl-3" {...testId("text-cell")}>
      <span className="text-gray-900 dark:text-white">{props.value}</span>
    </div>
  );
});

interface DoublesPlayerPairingsProps {
  match: Match;
  matchSetup: MatchSetup | null;
  pairings: PlayerPairing[];
  members: Member[];
  onUpdate: () => void;
}

interface PlayerPair {
  id: string;
  player1: Member;
  player2: Member;
  name: string; // Combined name for display
}

interface PairingGridRow {
  id: string;
  dateTime: string;
  displayDateTime: string;
  hole: number;
  holeLabel: string;
  pair1?: PlayerPair;
  pair2?: PlayerPair;
}

export const DoublesPlayerPairings: React.FC<DoublesPlayerPairingsProps> = ({
  match,
  matchSetup,
  onUpdate,
  members,
}) => {
  const [currentStep, setCurrentStep] = useState<"pairing" | "assignment">(
    "pairing"
  );
  const [selectedPlayers, setSelectedPlayers] = useState<Member[]>([]);
  const [playerPairs, setPlayerPairs] = useState<PlayerPair[]>([]);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [pairingGridApi, setPairingGridApi] = useState<GridApi | null>(null);
  const [holeAssignments, setHoleAssignments] = useState<DoublesHoleAssignment[]>([]);
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
  const [newHoleLabel, setNewHoleLabel] = useState<string>("A");
  const { isDarkMode } = useThemeStore();

  const selPlayerIds = new Set(
    (matchSetup?.selectedPlayers || []).map((p) => p.id)
  );
  console.log("Selected Player IDs:", Array.from(selPlayerIds).length);
  // Exclude already paired players from the availablePlayers list
  const pairedPlayerIds = new Set(
    playerPairs.flatMap((pair) => [pair.player1.id, pair.player2.id])
  );
  const availablePlayers = useMemo(
    () =>
      members
        .filter(
          (member) =>
            selPlayerIds.has(member.id) && !pairedPlayerIds.has(member.id)
        )
        .map((member) => {
          const p = matchSetup?.selectedPlayers.find(
            (player) => player.id === member.id
          );
          return {
            ...member,
            tournamentHandicap: p?.tournamentHandicap || 0,
          };
        }),
    [members, selPlayerIds, matchSetup?.selectedPlayers]
  );
  console.log(
    "Available Players:",
    availablePlayers.length,
    pairedPlayerIds.size
  );

  const {
    getDoublesPairingsByMatchId,
    getDoublesHoleAssignmentsByMatchId,
    createBulkDoublesHoleAssignment,
    deleteBulkDoublesHoleAssignment,
  } = useMatchSetupStore((state) => ({
    getDoublesPairingsByMatchId: state.getDoublesPairingsByMatchId,
    getDoublesHoleAssignmentsByMatchId:
      state.getDoublesHoleAssignmentsByMatchId,
    createBulkDoublesHoleAssignment: state.createBulkDoublesHoleAssignment,
    deleteBulkDoublesHoleAssignment: state.deleteBulkDoublesHoleAssignment,
  }));

  const fetchDoublesPairings = async () => {
    if (!match.id) return;
    setLoading(true);
    try {
      const pairings = await getDoublesPairingsByMatchId(match.id);
      setPlayerPairs(
        pairings.map((pairing) => ({
          id: `${pairing.player1.playerId}-${pairing.player2.playerId}`,
          player1: {
            id: pairing.player1.playerId,
            mid: pairing.player1.memberId,
            prefix: "",
            name: pairing.player1.playerName,
            addr1: "",
            addr2: "",
            addr3: "",
            city: pairing.player1.city,
            pin: "",
            state: "",
            type: "",
            dob: "",
            doj: "",
            handicap: pairing.player1.handicap,
            pho: "",
            phr: "",
            phm: "",
            sex: pairing.player1.gender as "Male" | "Female",
            ctcode: "",
            ccode: "",
            club: pairing.player1.club,
            memberof: "",
            centre: "",
            fax: "",
            email: "",
            selflag: false,
            dos: "",
            updt: false,
            createdAt: "",
            isDeleted: false,
            status: "Active" as const,
            age: pairing.player1.age,
          },
          player2: {
            id: pairing.player2.playerId,
            mid: pairing.player2.memberId,
            prefix: "",
            name: pairing.player2.playerName,
            addr1: "",
            addr2: "",
            addr3: "",
            city: pairing.player2.city,
            pin: "",
            state: "",
            type: "",
            dob: "",
            doj: "",
            handicap: pairing.player2.handicap,
            pho: "",
            phr: "",
            phm: "",
            sex: pairing.player2.gender as "Male" | "Female",
            ctcode: "",
            ccode: "",
            club: pairing.player2.club,
            memberof: "",
            centre: "",
            fax: "",
            email: "",
            selflag: false,
            dos: "",
            updt: false,
            createdAt: "",
            isDeleted: false,
            status: "Active" as const,
            age: pairing.player2.age,
          },
          name: `${pairing.player1.playerName} & ${pairing.player2.playerName}`,
        }))
      );
    } catch (error) {
      console.error("Failed to fetch doubles pairings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (match.id) {
      fetchDoublesPairings();
      fetchDoublesHoleAssignments();
    }
  }, [match.id]);

  const fetchDoublesHoleAssignments = async () => {
    if (!match.id) return;
    setLoading(true);
    try {
      const assignments = await getDoublesHoleAssignmentsByMatchId(match.id);
      setHoleAssignments(assignments);

      // After fetching hole assignments, we should immediately initialize the grid
      // This ensures that all holes are displayed in the grid
      if (currentStep === "assignment") {
        // We're initializing through the callback to ensure we have the latest data
        setTimeout(() => initializeGrid(), 0);
      }
    } catch (error) {
      console.error("Failed to fetch doubles hole assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format datetime for display
  const formatDateTimeForDisplay = (dateTime: string): string => {
    const dt = new Date(dateTime);
    return dt.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Helper function to create ISO datetime string
  const createDateTimeString = (date: string, time: string): string => {
    return `${date}T${time}:00.000Z`;
  };

  // Initialize grid with holes and assignments
  const initializeGrid = useCallback(() => {
    const defaultDateTime = createDateTimeString(
      new Date().toISOString().split("T")[0],
      "08:00"
    );

    // If there are hole assignments, use them to build the grid
    if (holeAssignments && holeAssignments.length > 0) {
      const initialData: PairingGridRow[] = holeAssignments.map((assignment, idx) => {
        // Convert existing hole assignments to pairs format
        let pair1: PlayerPair | undefined;
        let pair2: PlayerPair | undefined;

        if (assignment.selectedPairs.length >= 1) {
          // Get the first pair
          const pairId = assignment.selectedPairs[0];
          const foundPair = playerPairs.find(p => p.id === pairId);
          if (foundPair) {
            pair1 = foundPair;
          }
        }

        if (assignment.selectedPairs.length >= 2) {
          // Get the second pair
          const pairId = assignment.selectedPairs[1];
          const foundPair = playerPairs.find(p => p.id === pairId);
          if (foundPair) {
            pair2 = foundPair;
          }
        }

        return {
          id: `assignment-${assignment.id || idx}`,
          dateTime: assignment.dateTime || defaultDateTime,
          displayDateTime: assignment.displayDateTime || formatDateTimeForDisplay(defaultDateTime),
          hole: assignment.holeNumber,
          holeLabel: assignment.holeLabel || assignment.holeNumber.toString(),
          pair1,
          pair2,
        };
      });

      setGridData(initialData);
    } else {
      // Default to 18 holes if no assignments
      const initialData: PairingGridRow[] = Array.from({ length: 18 }, (_, i) => {
        const hole = i + 1;

        return {
          id: `default-${hole}`,
          dateTime: defaultDateTime,
          displayDateTime: formatDateTimeForDisplay(defaultDateTime),
          hole,
          holeLabel: hole.toString(),
          pair1: undefined,
          pair2: undefined,
        };
      });

      setGridData(initialData);
    }

    setPendingChanges(new Map());
  }, [holeAssignments, playerPairs]);

  useEffect(() => {
    if (currentStep === "assignment") {
      initializeGrid();
    }
  }, [currentStep, initializeGrid]);

  // Player pairing step handlers
  const handlePlayerSelection = (players: Member[]) => {
    setSelectedPlayers(players);
  };

  const handleCreatePair = () => {
    if (selectedPlayers.length !== 2) {
      alert("Please select exactly 2 players to create a pair");
      return;
    }

    // Check if players are already paired
    const alreadyPaired = playerPairs.some(
      (pair) =>
        pair.player1.id === selectedPlayers[0].id ||
        pair.player1.id === selectedPlayers[1].id ||
        pair.player2.id === selectedPlayers[0].id ||
        pair.player2.id === selectedPlayers[1].id
    );

    if (alreadyPaired) {
      alert("One or both players are already in a pair");
      return;
    }

    const newPair: PlayerPair = {
      id: `${selectedPlayers[0].id}-${selectedPlayers[1].id}`,
      player1: selectedPlayers[0],
      player2: selectedPlayers[1],
      name: `${selectedPlayers[0].name} & ${selectedPlayers[1].name}`,
    };

    setPlayerPairs((prev) => [...prev, newPair]);
    setSelectedPlayers([]);

    // Clear grid selection
    if (pairingGridApi) {
      pairingGridApi.deselectAll();
    }
  };

  const handleDeletePair = (pairId: string) => {
    setPlayerPairs((prev) => prev.filter((pair) => pair.id !== pairId));
  };

  const handleProceedToAssignment = async () => {
    if (playerPairs.length === 0) {
      alert("Please create at least one player pair before proceeding");
      return;
    }
    setCurrentStep("assignment");

    const playerPairsToSave = playerPairs.map((pair) => ({
      player1: {
        playerId: pair.player1.id,
        memberId: pair.player1.mid,
        playerName: pair.player1.name,
        handicap: pair.player1.handicap,
        age: pair.player1.age || 0,
        gender: pair.player1.sex,
        club: pair.player1.club,
        city: pair.player1.city,
      },
      player2: {
        playerId: pair.player2.id,
        memberId: pair.player2.mid,
        playerName: pair.player2.name,
        handicap: pair.player2.handicap,
        age: pair.player2.age || 0,
        gender: pair.player2.sex,
        club: pair.player2.club,
        city: pair.player2.city,
      },
    }));

    // Save player pairs to server or state management
    await useMatchSetupStore
      .getState()
      .createBulkDoublesPairing(playerPairsToSave, match.id);

    // save all pairs to server.
  };

  // Assignment step handlers
  const onGridReady = (params: GridReadyEvent) => {
    setGridApi(params.api);
  };

  const onPairingGridReady = (params: GridReadyEvent) => {
    setPairingGridApi(params.api);
  };

  // Get all assigned pairs across all rows
  const getAllAssignedPairs = (): Set<string> => {
    const assignedPairIds = new Set<string>();

    // Check current grid data
    gridData.forEach((row) => {
      [row.pair1, row.pair2].forEach((pair) => {
        if (pair) {
          assignedPairIds.add(pair.id);
        }
      });
    });

    // Check pending changes
    pendingChanges.forEach((value, key) => {
      if (key.includes("-pair") && value) {
        assignedPairIds.add(value.id);
      }
    });

    return assignedPairIds;
  };

  // Clear button cell renderer
  const ClearButtonCellRenderer = (params: any) => {
    const handleClear = () => {
      const rowId = params.data.id;

      // Clear all pairs in this row
      ["pair1", "pair2"].forEach((pairField) => {
        const key = `${rowId}-${pairField}`;
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
            ? { ...row, pair1: undefined, pair2: undefined }
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
      <div
        className="flex items-center justify-center h-full"
        {...testId("clear-button-cell")}
      >
        <button
          onClick={handleClear}
          className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
          title="Clear all pairs in this hole"
          {...testId("clear-button")}
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  };

  // Editable Date/Time cell renderer
  const DateTimeCellRenderer = (params: any) => {
    const { data } = params;

    const handleDateTimeChange = (newDateTime: string) => {
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
    const { date: currentDate, time: currentTime } = extractDateTimeFromBackendFormat(
      data.dateTime || ""
    );

    return (
      <div
        className="flex flex-col space-y-1 p-1"
        {...testId("datetime-cell")}
      >
        <input
          type="date"
          value={currentDate}
          onChange={(e) => {
            const newDateTime = createDateTimeString(
              e.target.value,
              currentTime
            );
            handleDateTimeChange(newDateTime);
          }}
          className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          style={{ fontSize: "10px", padding: "2px" }}
          {...testId("date-input")}
        />
        <input
          type="time"
          value={currentTime}
          onChange={(e) => {
            const newDateTime = createDateTimeString(
              currentDate,
              e.target.value
            );
            handleDateTimeChange(newDateTime);
          }}
          className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          style={{ fontSize: "10px", padding: "2px" }}
          {...testId("time-input")}
        />
      </div>
    );
  };

  // Hole number cell renderer
  const HoleCellRenderer = (params: any) => {
    return (
      <div
        className="flex items-center justify-center h-full"
        {...testId("hole-cell")}
      >
        <div className="bg-green-100 dark:bg-green-900 px-2 py-1 rounded-full">
          <span
            className="font-bold text-green-800 dark:text-green-200 text-xs"
            {...testId("hole-number")}
          >
            {params.data.hole}
          </span>
        </div>
      </div>
    );
  };

  // Hole label cell renderer (editable)
  const HoleLabelCellRenderer = (params: any) => {
    const { data, value } = params;

    const handleLabelChange = (newLabel: string) => {
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
      <div
        className="w-full h-full flex items-center p-1"
        {...testId("hole-label-cell")}
      >
        <input
          type="text"
          value={value || data.hole.toString()}
          onChange={(e) => handleLabelChange(e.target.value)}
          className="w-full text-xs text-center border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-bold"
          style={{ fontSize: "11px", padding: "4px" }}
          placeholder={data.hole.toString()}
          {...testId("hole-label-input")}
        />
      </div>
    );
  };

  // Pair dropdown cell renderer
  const PairDropdownCellRenderer = (params: any) => {
    const { colDef, data, value } = params;
    const pairPosition = colDef.field as "pair1" | "pair2";

    const allAssignedPairs = getAllAssignedPairs();

    // Filter available pairs (not assigned anywhere, except current selection)
    const availablePairs = playerPairs.filter(
      (pair) => !allAssignedPairs.has(pair.id) || pair.id === value?.id
    );

    const handlePairChange = (pairId: string) => {
      const selectedPair = pairId
        ? playerPairs.find((p) => p.id === pairId)
        : null;
      const key = `${data.id}-${pairPosition}`;

      if (selectedPair) {
        setPendingChanges((prev) => new Map(prev.set(key, selectedPair)));
        params.setValue(selectedPair);

        // Update grid data immediately for real-time filtering
        setGridData((prevData) =>
          prevData.map((row) =>
            row.id === data.id ? { ...row, [pairPosition]: selectedPair } : row
          )
        );
      } else if (pairId === "") {
        // Pair deselected
        setPendingChanges((prev) => {
          const newMap = new Map(prev);
          newMap.set(key, null);
          return newMap;
        });
        params.setValue(null);

        // Update grid data immediately
        setGridData((prevData) =>
          prevData.map((row) =>
            row.id === data.id ? { ...row, [pairPosition]: undefined } : row
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

    return (
      <div
        className="w-full h-full flex items-center p-1"
        {...testId(`pair-dropdown-cell-${pairPosition}`)}
      >
        <select
          value={value?.id || ""}
          onChange={(e) => handlePairChange(e.target.value)}
          className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          style={{ fontSize: "10px", padding: "2px" }}
          {...testId(`pair-dropdown-${pairPosition}`)}
        >
          <option value="">Select Pair</option>
          {availablePairs.map((pair) => (
            <option key={pair.id} value={pair.id}>
              {pair.name}
            </option>
          ))}
        </select>
      </div>
    );
  };

  // Column definitions for player pairing step
  const pairingColumnDefs: ColDef[] = [
    {
      headerName: "",
      checkboxSelection: true,
      headerCheckboxSelection: false,
      width: 50,
      pinned: "left",
      suppressMovable: true,
      ...testId("pairing-checkbox"),
    },
    {
      field: "mid",
      headerName: "MID",
      width: 100,
      maxWidth: 120,
      sortable: true,
      filter: true,
      cellRenderer: TextCellRenderer,
      minWidth: 150,
      ...testId("pairing-mid-column"),
    },
    {
      field: "name",
      headerName: "Name",
      flex: 1,
      sortable: true,
      filter: true,
      cellRenderer: TextCellRenderer,
      minWidth: 150,
      ...testId("pairing-name-column"),
    },
    {
      field: "dob",
      headerName: "Date of Birth",
      width: 100,
      sortable: true,
      filter: true,
      cellRenderer: DateCellRenderer,
      ...testId("pairing-dob-column"),
    },
    {
      field: "age",
      headerName: "Age",
      width: 100,
      sortable: true,
      filter: true,
      ...testId("pairing-age-column"),
    },
    {
      field: "sex",
      headerName: "Gender",
      width: 100,
      sortable: true,
      filter: true,
      cellRenderer: TextCellRenderer,
      ...testId("pairing-gender-column"),
    },
    {
      field: "handicap",
      headerName: "Handicap",
      width: 100,
      sortable: true,
      filter: true,
      ...testId("pairing-handicap-column"),
    },
    {
      field: "city",
      headerName: "City",
      width: 180,
      minWidth: 150,
      sortable: true,
      filter: true,
      headerClass: "ag-header-cell-label",
      cellRenderer: TextCellRenderer,
      ...testId("pairing-city-column"),
    },
    {
      field: "club",
      headerName: "Club",
      width: 150,
      minWidth: 120,
      sortable: true,
      filter: true,
      headerClass: "ag-header-cell-label",
      cellRenderer: TextCellRenderer,
      ...testId("pairing-club-column"),
    },
  ];

  // Column definitions for assignment step
  const assignmentColumnDefs: ColDef[] = [
    {
      headerName: "Actions",
      width: 70,
      pinned: "left",
      cellRenderer: ClearButtonCellRenderer,
      sortable: false,
      filter: false,
      resizable: false,
      ...testId("assignment-actions-column"),
    },
    {
      field: "displayDateTime",
      headerName: "Date & Time",
      width: 140,
      pinned: "left",
      cellRenderer: DateTimeCellRenderer,
      sortable: true,
      filter: true,
      resizable: false,
      editable: false,
      ...testId("assignment-datetime-column"),
    },
    {
      field: "hole",
      headerName: "Hole #",
      width: 80,
      pinned: "left",
      cellRenderer: HoleCellRenderer,
      sortable: true,
      filter: true,
      resizable: false,
      ...testId("assignment-hole-column"),
    },
    {
      field: "holeLabel",
      headerName: "Hole Label",
      width: 90,
      pinned: "left",
      cellRenderer: HoleLabelCellRenderer,
      sortable: true,
      filter: true,
      resizable: false,
      editable: false,
      ...testId("assignment-hole-label-column"),
    },
    {
      field: "pair1",
      headerName: "Pair 1",
      flex: 1,
      minWidth: 200,
      cellRenderer: PairDropdownCellRenderer,
      sortable: false,
      filter: false,
      editable: false,
      valueFormatter: (params) => (params.value ? params.value.name : ""),
      ...testId("assignment-pair1-column"),
    },
    {
      field: "pair2",
      headerName: "Pair 2",
      flex: 1,
      minWidth: 200,
      cellRenderer: PairDropdownCellRenderer,
      sortable: false,
      filter: false,
      editable: false,
      valueFormatter: (params) => (params.value ? params.value.name : ""),
      ...testId("assignment-pair2-column"),
    },
  ];

  // Auto-generate assignments for doubles
  const handleGenerateAutoAssignments = async () => {
    if (playerPairs.length === 0) return;
    if (
      !window.confirm(
        "This will re-do ALL hole assignments and overwrite any existing pairings. Continue?"
      )
    ) {
      return;
    }
    try {
      setLoading(true);
      // 1. Prepare pairs for assignment
      const pairs = [...playerPairs];
      const pairsPerHole = 2;
      const holesPerSet = 18;
      const baseDate = new Date();
      baseDate.setHours(8, 0, 0, 0); // Start at 8:00 AM
      const holeSets: {
        dateTime: string;
        displayDateTime: string;
        hole: number;
        holeLabel: string;
        pairs: any[];
      }[] = [];
      // Helper to get hole label suffix (A, B, C, ...)
      const getHoleLabelSuffix = (index: number) => {
        if (index === 0) return "";
        return String.fromCharCode(65 + index - 1); // 0: '', 1: 'A', 2: 'B', ...
      };
      
      let pairIdx = 0;
      let totalPairs = pairs.length;
      
      // Calculate how many complete sets we need
      const totalSets = Math.ceil(totalPairs / (pairsPerHole * holesPerSet));
      
      for (let setIdx = 0; setIdx < totalSets; setIdx++) {
        // For each set of 18 holes
        for (let holeNum = 1; holeNum <= holesPerSet; holeNum++) {
          // If we've assigned all pairs, break
          if (pairIdx >= totalPairs) break;
          
          const pairsForHole = pairs.slice(pairIdx, pairIdx + pairsPerHole);
          if (pairsForHole.length === 0) break;
          
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
            pairs: pairsForHole,
          });
          
          pairIdx += pairsPerHole;
        }
      }
      
      // 2. Update gridData with new assignments
      const newGridData = holeSets.map((h, i) => ({
        id: `auto-${i + 1}`,
        dateTime: h.dateTime,
        displayDateTime: h.displayDateTime,
        hole: h.hole,
        holeLabel: h.holeLabel,
        pair1: h.pairs[0],
        pair2: h.pairs.length > 1 ? h.pairs[1] : undefined,
      }));
      
      setGridData(newGridData);
      setPendingChanges(new Map());
      
      // 3. Create DoublesHoleAssignment objects
      const holeAssignments: DoublesHoleAssignment[] = newGridData
        .filter(row => row.pair1 || row.pair2) // Only include rows with at least one pair
        .map(row => {
          const selectedPairs: string[] = [];
          if (row.pair1) selectedPairs.push(row.pair1.id);
          if (row.pair2) selectedPairs.push(row.pair2.id);
          
          return {
            id: '', // Backend will assign IDs for new assignments
            matchId: match.id,
            dateTime: row.dateTime,
            displayDateTime: row.displayDateTime,
            holeNumber: row.hole,
            holeLabel: row.holeLabel,
            selectedPairs
          };
        });
      
      // 4. Delete existing assignments
      const existingIds = holeAssignments.map(assignment => assignment.id).filter(id => id !== '');
      if (existingIds.length > 0) {
        await deleteBulkDoublesHoleAssignment(existingIds);
      }
      
      // 5. Create new assignments
      if (holeAssignments.length > 0) {
        await createBulkDoublesHoleAssignment(holeAssignments);
      }
      
      // 6. Refresh data from server
      await fetchDoublesHoleAssignments();
      onUpdate();
    } catch (error) {
      console.error("Failed to auto-generate assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateHoles = async () => {
    if (!newDate.trim() || !newTime.trim() || !newHoleLabel.trim()) {
      alert("Please fill in all fields (Date, Time, and Hole Label)");
      return;
    }

    try {
      setLoading(true);

      const dateTime = createDateTimeString(newDate, newTime);
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
          pair1: undefined,
          pair2: undefined,
        };
      });

      // Add new holes to existing grid data
      setGridData((prevData) => [...prevData, ...newHoles]);

      // Reset form
      setNewDate(new Date().toISOString().split("T")[0]);
      setNewTime("08:00");
      setNewHoleLabel("A");
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

  const handleSaveChanges = async () => {
    if (pendingChanges.size === 0) return;

    try {
      setLoading(true);

      // Group changes by row
      const rowChanges = new Map<string, Partial<PairingGridRow>>();

      pendingChanges.forEach((value, key) => {
        const [rowId, field] = key.split("-");

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
        } else if (field.startsWith("pair")) {
          rowData[field as keyof PairingGridRow] = value;
        }
      });

      // Create array of hole assignments to save
      const updatedHoleAssignments: DoublesHoleAssignment[] = [];
      const existingAssignmentIds: string[] = [];
      
      // First collect existing assignment IDs for deletion if needed
      for (const assignment of holeAssignments) {
        existingAssignmentIds.push(assignment.id);
      }

      // Create new assignments from the updated grid data
      for (const [rowId, changes] of rowChanges) {
        const originalRow = gridData.find((row) => row.id === rowId);
        if (!originalRow) continue;

        const updatedRow = { ...originalRow, ...changes };
        
        // Skip rows with no pairs assigned
        if (!updatedRow.pair1 && !updatedRow.pair2) continue;
        
        // Create the selected pairs array
        const selectedPairs: string[] = [];
        if (updatedRow.pair1) selectedPairs.push(updatedRow.pair1.id);
        if (updatedRow.pair2) selectedPairs.push(updatedRow.pair2.id);
        
        // Check if we have an existing assignment for this hole
        const existingAssignment = holeAssignments.find(
          assignment => assignment.holeNumber === updatedRow.hole
        );
        
        if (existingAssignment) {
          // Update existing assignment
          updatedHoleAssignments.push({
            ...existingAssignment,
            dateTime: updatedRow.dateTime,
            displayDateTime: updatedRow.displayDateTime,
            holeLabel: updatedRow.holeLabel,
            selectedPairs
          });
        } else {
          // Create new assignment (without id as it will be assigned by the backend)
          updatedHoleAssignments.push({
            id: '', // This will be ignored by the backend when creating
            matchId: match.id,
            dateTime: updatedRow.dateTime,
            displayDateTime: updatedRow.displayDateTime,
            holeNumber: updatedRow.hole,
            holeLabel: updatedRow.holeLabel,
            selectedPairs
          });
        }
      }

      // Delete existing assignments and create new ones
      if (existingAssignmentIds.length > 0) {
        await deleteBulkDoublesHoleAssignment(existingAssignmentIds);
      }

      if (updatedHoleAssignments.length > 0) {
        await createBulkDoublesHoleAssignment(updatedHoleAssignments);
      }

      setPendingChanges(new Map());
      fetchDoublesHoleAssignments(); // Refresh assignments from server
      initializeGrid(); // Refresh grid with new data
      onUpdate();
    } catch (error) {
      console.error("Failed to save hole assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChanges = () => {
    setPendingChanges(new Map());
    initializeGrid(); // Reload original data
  };

  // Handle clearing all assignments
  const handleClearAllAssignments = async () => {
    if (
      window.confirm("Are you sure you want to clear ALL pair assignments?")
    ) {
      try {
        setLoading(true);

        // Delete all existing assignments
        const existingIds = holeAssignments.map(assignment => assignment.id).filter(id => id !== '');
        if (existingIds.length > 0) {
          await deleteBulkDoublesHoleAssignment(existingIds);
        }

        // Reset the grid data
        const defaultDateTime = createDateTimeString(
          new Date().toISOString().split("T")[0],
          "08:00"
        );

        const initialData: PairingGridRow[] = Array.from({ length: 18 }, (_, i) => {
          const hole = i + 1;
          return {
            id: `default-${hole}`,
            dateTime: defaultDateTime,
            displayDateTime: formatDateTimeForDisplay(defaultDateTime),
            hole,
            holeLabel: hole.toString(),
            pair1: undefined,
            pair2: undefined,
          };
        });

        setGridData(initialData);
        setPendingChanges(new Map());
        setHoleAssignments([]);

        onUpdate();
      } catch (error) {
        console.error("Failed to clear assignments:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle exporting pairings to CSV
  const handleExportPairings = () => {
    try {
      // Create headers for the CSV
      const csvHeaders = [
        "Hole #",
        "Hole Label",
        "Date & Time",
        "Pair 1 MIDs",
        "Pair 1 Names",
        "Pair 1 Handicaps",
        "Pair 2 MIDs",
        "Pair 2 Names",
        "Pair 2 Handicaps"
      ].join(",");

      // Map grid data to CSV rows
      const csvRows = gridData.map(row => {
        // Format pair 1 information
        const pair1MIDs = row.pair1 ? `${row.pair1.player1.mid} & ${row.pair1.player2.mid}` : "";
        const pair1Names = row.pair1 ? `${row.pair1.player1.name} & ${row.pair1.player2.name}` : "";
        const pair1Handicaps = row.pair1 ? `${row.pair1.player1.handicap} & ${row.pair1.player2.handicap}` : "";

        // Format pair 2 information
        const pair2MIDs = row.pair2 ? `${row.pair2.player1.mid} & ${row.pair2.player2.mid}` : "";
        const pair2Names = row.pair2 ? `${row.pair2.player1.name} & ${row.pair2.player2.name}` : "";
        const pair2Handicaps = row.pair2 ? `${row.pair2.player1.handicap} & ${row.pair2.player2.handicap}` : "";

        return [
          row.hole,
          `"${row.holeLabel}"`,
          `"${formatDateTimeForDisplay(row.dateTime)}"`,
          `"${pair1MIDs}"`,
          `"${pair1Names}"`,
          `"${pair1Handicaps}"`,
          `"${pair2MIDs}"`,
          `"${pair2Names}"`,
          `"${pair2Handicaps}"`
        ].join(",");
      });

      // Combine headers and rows
      const csvContent = [csvHeaders, ...csvRows].join("\n");

      // Create a blob and download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      // Create a download link and trigger it
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `doubles_pairings_${match.name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`);
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

  const getAssignedPairsCount = () => {
    const assignedPairIds = new Set<string>();
    gridData.forEach((row) => {
      [row.pair1, row.pair2].forEach((pair) => {
        if (pair) assignedPairIds.add(pair.id);
      });
    });
    return assignedPairIds.size;
  };

  if (availablePlayers.length === 0 && pairedPlayerIds.size === 0) {
    return (
      <div className="text-center py-12" {...testId("no-players-selected-container")}>
        <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2" {...testId("no-players-selected-heading")}>
          No Players Selected
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Please select players first before creating doubles pairings.
        </p>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Go to the <strong>Player Selection</strong> tab to choose
            participants.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" {...testId("doubles-pairing-container")}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white" {...testId("doubles-pairing-header")}>
            Doubles Tournament Pairings for {match.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {currentStep === "pairing"
              ? 'Step 1: Create player pairs by selecting 2 players and clicking "Create Pair"'
              : "Step 2: Assign player pairs to holes with editable date/time per row"}
          </p>
        </div>

        {currentStep === "assignment" && (
          <button
            onClick={() => setCurrentStep("pairing")}
            className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            {...testId("back-to-pairing-button")}
          >
            <Users className="h-4 w-4" />
            <span>Back to Pairing</span>
          </button>
        )}
      </div>

      {/* Step 1: Player Pairing */}
      {currentStep === "pairing" && (
        <>
          {/* Player Selection Grid */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white" {...testId("player-selection-heading")}>
                  Select Players to Create Pairs
                </h4>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400" {...testId("selected-players-count")}>
                    {selectedPlayers.length} of 2 selected
                  </span>
                  <button
                    onClick={handleCreatePair}
                    disabled={selectedPlayers.length !== 2}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors"
                    {...testId("create-pair-button")}
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Create Pair</span>
                  </button>
                </div>
              </div>
            </div>

            <div
              className={`${isDarkMode ? "ag-theme-alpine-dark" : "ag-theme-alpine"
                }`}
              style={{ height: "400px", width: "100%" }}
              {...testId("player-selection-grid")}
            >
              <GridFilter gridApi={pairingGridApi} placeHolder="Search players..." />
              <AgGridReact
                columnDefs={pairingColumnDefs}
                rowData={availablePlayers}
                onGridReady={onPairingGridReady}
                onSelectionChanged={() => {
                  if (pairingGridApi) {
                    const selectedRows = pairingGridApi.getSelectedRows();
                    handlePlayerSelection(selectedRows);
                  }
                }}
                domLayout="normal"
                animateRows={true}
                rowSelection="multiple"
                suppressCellFocus={true}
                defaultColDef={{
                  resizable: true,
                  sortable: true,
                  filter: true,
                }}
                rowMultiSelectWithClick={true}
                suppressRowDeselection={false}
                getRowId={(params) => params.data.id}
              />
            </div>
          </div>

          {/* Created Pairs List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6" {...testId("created-pairs-list")}>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                Created Player Pairs ({playerPairs.length})
              </h4>
              {playerPairs.length > 0 && (
                <button
                  onClick={handleProceedToAssignment}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  {...testId("proceed-to-assignment-button")}
                >
                  <span>Proceed to Assignment</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>

            {playerPairs.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p>No player pairs created yet</p>
                <p className="text-sm mt-1">
                  Select 2 players above and click "Create Pair"
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {playerPairs.map((pair) => (
                  <div
                    key={pair.id}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                    {...testId(`pair-item-${pair.id}`)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full">
                        <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h5 className="font-semibold text-gray-900 dark:text-white">
                          {pair.player1.mid} - {pair.name} - {pair.player2.mid}
                        </h5>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          HCP: {pair.player1.handicap} & {pair.player2.handicap}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeletePair(pair.id)}
                      className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      {...testId(`delete-pair-button-${pair.id}`)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Step 2: Hole Assignment */}
      {currentStep === "assignment" && (
        <>
          {/* Summary Stats */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4" {...testId("assignment-summary")}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-green-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  Available Pairs:
                </span>
                <span className="font-medium text-gray-900 dark:text-white" {...testId("available-pairs-count")}>
                  {playerPairs.length}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-purple-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  Assigned:
                </span>
                <span className="font-medium text-gray-900 dark:text-white" {...testId("assigned-pairs-count")}>
                  {getAssignedPairsCount()}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-orange-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  Total Holes:
                </span>
                <span className="font-medium text-gray-900 dark:text-white" {...testId("total-holes-count")}>
                  {gridData.length}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-600 dark:text-gray-400">
                  Changes:
                </span>
                <span className="font-medium text-gray-900 dark:text-white" {...testId("pending-changes-count")}>
                  {pendingChanges.size}
                </span>
              </div>
            </div>
          </div>

          {/* Auto Generate Assignments Button */}
          <div className="flex flex-wrap items-center gap-2 mt-2 mb-2">
            <button
              onClick={handleGenerateAutoAssignments}
              className="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
              disabled={loading || playerPairs.length === 0}
              title="Auto-generate hole assignments for all pairs"
              {...testId("auto-generate-assignments-button")}
            >
              <Shuffle className="h-4 w-4" />
              <span>Auto Generate Assignments</span>
            </button>

            <button
              onClick={handleClearAllAssignments}
              className="flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors text-sm"
              disabled={loading}
              title="Clear all hole assignments"
              {...testId("clear-all-assignments-button")}
            >
              <RotateCcw className="h-4 w-4" />
              <span>Clear All</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowAddHoles(true)}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors text-sm"
              disabled={loading}
              {...testId("generate-holes-button")}
            >
              <Plus className="h-4 w-4" />
              <span>Generate Holes</span>
            </button>

            <button
              onClick={() => handleExportPairings()}
              className="flex items-center space-x-2 px-3 py-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors text-sm"
              title="Export Pairings"
              {...testId("export-pairings-button")}
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>

          {/* Generate Holes Section */}
          {showAddHoles && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6" {...testId("generate-holes-section")}>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white" {...testId("generate-holes-heading")}>
                  Generate 18 New Holes
                </h4>
                <button
                  onClick={() => setShowAddHoles(false)}
                  className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  {...testId("close-generate-holes-button")}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="new-date">
                    Date
                  </label>
                  <input
                    type="date"
                    id="new-date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    {...testId("new-date-input")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="new-time">
                    Tee Time
                  </label>
                  <input
                    type="time"
                    id="new-time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    {...testId("new-time-input")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="new-hole-label">
                    Hole Label Suffix
                  </label>
                  <input
                    type="text"
                    id="new-hole-label"
                    value={newHoleLabel}
                    onChange={(e) => setNewHoleLabel(e.target.value)}
                    placeholder="e.g., A, B, -PM"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    {...testId("new-hole-label-input")}
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
                    {...testId("generate-18-holes-button")}
                  >
                    {loading ? "Generating..." : "Generate 18 Holes"}
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
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
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4" {...testId("pending-changes-banner")}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <span className="text-amber-800 dark:text-amber-200 font-medium" {...testId("pending-changes-message")}>
                    {pendingChanges.size} unsaved changes
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleSaveChanges}
                    disabled={loading}
                    className="flex items-center space-x-1 px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded text-sm transition-colors"
                    {...testId("save-changes-button")}
                  >
                    <Save className="h-3 w-3" />
                    <span>Save Changes</span>
                  </button>
                  <button
                    onClick={handleClearChanges}
                    className="flex items-center space-x-1 px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors"
                    {...testId("reset-changes-button")}
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* AG Grid */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h5 className="font-semibold text-gray-900 dark:text-white">
                Pair Assignments Grid ({gridData.length} holes)
              </h5>
            </div>
            <div
              className={`${isDarkMode ? "ag-theme-alpine-dark" : "ag-theme-alpine"
                }`}
              style={{ height: "700px", width: "100%" }}
              {...testId("assignment-grid")}
            >
              <AgGridReact
                columnDefs={assignmentColumnDefs}
                rowData={gridData}
                onGridReady={onGridReady}
                domLayout="normal"
                animateRows={true}
                suppressCellFocus={false}
                defaultColDef={{
                  resizable: true,
                  suppressMovable: true,
                }}
                suppressRowClickSelection={true}
                enableCellTextSelection={false}
                suppressColumnVirtualisation={false}
                rowHeight={60}
                headerHeight={40}
              />
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4" {...testId("instructions-section")}>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              Doubles Tournament Instructions:
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>
                • Each row represents one hole with editable date and time
              </li>
              <li>
                • Edit date/time directly in each row for flexible scheduling
              </li>
              <li>
                • Edit hole labels to customize naming (e.g., 1A, 1B for
                multiple rounds)
              </li>
              <li>
                • Each player pair can only be assigned once across all holes
              </li>
              <li>• Use dropdowns to select player pairs for each hole</li>
              <li>
                • Click the X button to clear all pairs from a specific hole
              </li>
              <li>• Save changes to persist your assignments</li>
              <li>
                • Perfect for doubles tournaments with flexible scheduling
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
};
