//PlayerSelection.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { GridApi } from "ag-grid-community";
import { Match, MatchSetup, Meet } from "../types/index"
import {
  Users,
  Search,
  UserCheck,
  UserX,
  Trophy,
  Mail,
  Phone,
  Grid,
  List,
} from "lucide-react";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { Member } from "../types/admin-member";
import { MemberGrid } from "./MemberGrid";
import { GridFilter } from "./Filter";
import { PlayersGrid } from "./PlayersGrid";
import { testId } from "../utils/testId";

interface PlayerSelectionProps {
  match: Match;
  matchSetup: MatchSetup | null;
  members: Member[];
  meet: Meet | null;
  onUpdate: (selectedPlayers: Member[]) => void;
}

export const PlayerSelection: React.FC<PlayerSelectionProps> = ({
  match,
  matchSetup,
  members,
  onUpdate,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "cards">("grid");
  const [isMobile, setIsMobile] = useState(false);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [selectedPlayers, setSelectedPlayers] = useState<Member[]>([]);
  const isUpdatingSelection = useRef(false);

  const updateGridSelection = useCallback(
    (players: Member[]) => {
      if (!gridApi) return;

      isUpdatingSelection.current = true;

      gridApi.deselectAll();

      if (players.length > 0) {
        const selectedIds = new Set(players.map((p) => p.id));
        gridApi.forEachNode((node) => {
          if (node.data && selectedIds.has(node.data.id)) {
            node.setSelected(true, false);
          }
        });
      }

      setTimeout(() => {
        isUpdatingSelection.current = false;
      }, 100);
    },
    [gridApi]
  );

  useEffect(() => {
    if (
      members.length > 0 &&
      matchSetup?.selectedPlayers &&
      Array.isArray(matchSetup.selectedPlayers)
    ) {
      const initialSelected = members.filter((m) =>
        matchSetup.selectedPlayers.some((sp) => sp.id === m.id)
      );
      setSelectedPlayers(initialSelected);

      if (gridApi) {
        updateGridSelection(initialSelected);
      }
    }
  }, [members, matchSetup, gridApi, updateGridSelection]);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setViewMode("cards");
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const filteredMembers = members.filter(
    (member) =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isPlayerSelected = (member: Member) => {
    return selectedPlayers.some((p) => p.id === member.id);
  };

  const togglePlayerSelection = (member: Member) => {
    let updatedPlayers;
    if (isPlayerSelected(member)) {
      updatedPlayers = selectedPlayers.filter((p) => p.id !== member.id);
    } else {
      updatedPlayers = [...selectedPlayers, member];
    }

    setSelectedPlayers(updatedPlayers);
    onUpdate(updatedPlayers);
  };

  const selectAllPlayers = useCallback(() => {
    const allPlayers = [...members];
    setSelectedPlayers(allPlayers);
    onUpdate(allPlayers);
    updateGridSelection(allPlayers);
  }, [members, onUpdate, updateGridSelection]);

  const clearAllPlayers = useCallback(() => {
    setSelectedPlayers([]);
    onUpdate([]);
    updateGridSelection([]);
  }, [onUpdate, updateGridSelection]);

  const onSelectionChanged = useCallback(() => {
    if (!gridApi || isUpdatingSelection.current) return;

    const selectedRows = gridApi.getSelectedRows();

    const currentIds = new Set(selectedPlayers.map((p) => p.id));
    const newIds = new Set(selectedRows.map((p) => p.id));

    if (
      currentIds.size !== newIds.size ||
      selectedPlayers.some((p) => !newIds.has(p.id)) ||
      selectedRows.some((p) => !currentIds.has(p.id))
    ) {
      setSelectedPlayers(selectedRows);
      onUpdate(selectedRows);
    }
  }, [gridApi, onUpdate, selectedPlayers]);

  const handleGridApiReady = useCallback(
    (api: GridApi) => {
      setGridApi(api);

      if (selectedPlayers.length > 0) {
        setTimeout(() => {
          updateGridSelection(selectedPlayers);
        }, 100);
      }
    },
    [selectedPlayers, updateGridSelection]
  );

  const handleDeletePlayer = useCallback(
    (id: string) => {
      const updatedPlayers = selectedPlayers.filter((p) => p.id !== id);
      setSelectedPlayers(updatedPlayers);
      onUpdate(updatedPlayers);
      updateGridSelection(updatedPlayers);
    },
    [selectedPlayers, onUpdate, updateGridSelection]
  );

  return (
    <div className="space-y-6" {...testId("player-selection-container")}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white" {...testId("player-selection-title")}>
            Player Selection for {match.name} {matchSetup?.matchId}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Select members to participate in this match
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <Users className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600 dark:text-gray-400" {...testId("selected-players-count")}>
            {selectedPlayers.length} of {members.length} selected
          </span>
        </div>

        {/* View Mode Toggle - Desktop Only */}
        {!isMobile && (
          <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              {...testId("grid-view-button")}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === "grid"
                  ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <Grid className="h-4 w-4" />
              <span>Grid</span>
            </button>
            <button
              onClick={() => setViewMode("cards")}
              {...testId("cards-view-button")}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === "cards"
                  ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <List className="h-4 w-4" />
              <span>Cards</span>
            </button>
          </div>
        )}
      </div>

      {/* Selection Summary */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4" {...testId("selection-summary")}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Trophy className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span className="font-medium text-green-900 dark:text-green-100" {...testId("selected-summary-count")}>
              {selectedPlayers.length} players selected
            </span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={selectAllPlayers}
              {...testId("select-all-button")}
              className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              Select All
            </button>
            <button
              onClick={clearAllPlayers}
              {...testId("clear-all-button")}
              className="px-3 py-1 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>

        {selectedPlayers.length > 0 && (
          <PlayersGrid
            {...testId("selected-players-grid")}
            members={selectedPlayers}
            deletePlayer={handleDeletePlayer}
          />
        )}
      </div>

      {/* Search - Only show for cards view */}
      {viewMode === "cards" && (
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search members by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            {...testId("member-search-input")}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      )}

      {/* Members Display */}
      {viewMode === "grid" && !isMobile ? (
        /* AG Grid View - Desktop */
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow" {...testId("members-ag-grid-container")}>
          <div className="mb-2">
            <GridFilter gridApi={gridApi} placeHolder="Search members..." {...testId("members-grid-filter")} />
          </div>
          <MemberGrid
            {...testId("members-ag-grid")}
            hideActions={true}
            showSelectionCheckbox={true}
            onGridApiReady={handleGridApiReady}
            onSelectionChanged={onSelectionChanged}
            selectedPlayers={selectedPlayers}
            showMobileAndEmail={false}
          />
        </div>
      ) : (
        /* Cards View - Mobile and Desktop Cards Mode */
        <div className="grid gap-4" {...testId("members-cards-container")}>
          {filteredMembers.map((member) => {
            const selected = isPlayerSelected(member);
            return (
              <div
                key={member.id}
                {...testId(`member-card-${member.id}`)}
                className={`border rounded-lg p-4 transition-all cursor-pointer ${
                  selected
                    ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600"
                }`}
                onClick={() => togglePlayerSelection(member)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`p-2 rounded-full ${
                        selected
                          ? "bg-green-100 dark:bg-green-800"
                          : "bg-gray-100 dark:bg-gray-700"
                      }`}
                    >
                      {selected ? (
                        <UserCheck className="h-5 w-5 text-green-600 dark:text-green-400" {...testId(`member-selection-icon-${member.id}`)} />
                      ) : (
                        <UserX className="h-5 w-5 text-gray-400" {...testId(`member-selection-icon-${member.id}`)} />
                      )}
                    </div>

                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white" {...testId(`member-name-${member.id}`)}>
                        {member.name}
                      </h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Mail className="h-3 w-3" />
                          <span>{member.email}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Phone className="h-3 w-3" />
                          <span>{member.phm}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        Handicap: {member.handicap}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredMembers.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400" {...testId("no-members-found")}>
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p>No members found matching your search</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
