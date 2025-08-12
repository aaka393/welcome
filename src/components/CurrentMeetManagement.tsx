//CurrentMeetManagement.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Match } from "../types/index"
import { useAdminStore } from "../stores/useAdminStore";
import { PlayerSelection } from "./PlayerSelection";
import {
  Trophy,
  Users,
  Calendar,
  MapPin,
  Target,
  AlertCircle,
} from "lucide-react";
import { Member } from "../types/admin-member";
import { backendTimestampToDate } from "../utils/date-utils";
import { SinglesPlayerPairings } from "./SinglesPlayerPairings";
import { DoublesPlayerPairings } from "./DoublesPlayerPairings";
import { useCommonDataStore } from "../stores/useCommonDataStore";
import { testId } from "../utils/testId";

export const CurrentMeetManagement: React.FC = () => {
  // Only maintain state that's not in the store
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [activeTab, setActiveTab] = useState<"players" | "pairings">("players");

  // Get store data and actions using selectors
  const {
    meets,
    members,
    matches,
    getActiveMeet,
    playerPairings,
    matchSetups,
  } = useCommonDataStore();

  const matchSetup = useMemo(() => {
    return matchSetups.find((setup) => setup.matchId === selectedMatch?.id);
  }, [matchSetups, selectedMatch]);

  const pairings = useMemo(() => {
    return playerPairings.filter((pairing) => pairing.matchId === selectedMatch?.id);
  }, [playerPairings, selectedMatch]);

  const updateMatchSetup = useAdminStore((state) => state.updateMatchSetup);

  const currentMeet = getActiveMeet();

  // Compute derived values safely outside Zustand
  const activeMeet = useMemo(
    () => meets.find((meet) => meet.isActive) || null,
    [meets]
  );
  const activeMembers = useMemo(
    () => members.filter((member) => member.status === "Active") as Member[],
    [members]
  );

  // When matches change, ensure selectedMatch exists
  useEffect(() => {
    if (
      matches.length > 0 &&
      (!selectedMatch || !matches.find((m) => m.id === selectedMatch.id))
    ) {
      setSelectedMatch(matches[0]);
    }
  }, [matches, selectedMatch]);

  const handlePlayerSelectionUpdate = async (selectedPlayers: Member[]) => {
    if (!selectedMatch || !currentMeet) return;

    try {
      const playersWithHandicap = selectedPlayers.map((player) => ({
        ...player,
        tournamentHandicap: Math.round(
          (player as Member & { tournamentHandicap?: number })
            .tournamentHandicap ??
            player.handicap * (currentMeet?.handicapPercentage / 100)
        ),
      }));

      await updateMatchSetup(selectedMatch.id, {
        matchId: selectedMatch.id,
        selectedPlayers: playersWithHandicap,
        pairings: matchSetup?.pairings || [],
      });

      // await loadMatchSetup();
    } catch (error) {
      console.error("Failed to update player selection:", error);
    }
  };

  const handlePairingsUpdate = async () => {
    
  };

  // The previous test file had a welcome message. I'm adding a data-testid here
  // in case this component is a child of the one that renders it.
  // The original test also expected the 'current-meet-tab' to be visible,
  // so I've added a testid to the top-level container for general use.
  
  if (!activeMeet) {
    return (
      <div {...testId('no-active-meet-container')} className="text-center py-12">
        <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No Active Meet
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          There is currently no active meet. Please activate a meet first to
          manage matches and players.
        </p>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Go to the <strong>Meets</strong> tab to create or activate a meet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div {...testId('current-meet-tab')} className="space-y-6">
      {/* Current Meet Header */}
      <div {...testId('current-meet-header')} className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
        <div className="flex items-center space-x-3 mb-4">
          <Trophy className="h-8 w-8 text-green-600 dark:text-green-400" />
          <div>
            <h2 {...testId('current-meet-name')} className="text-2xl font-bold text-gray-900 dark:text-white">
              {activeMeet.name}
            </h2>
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>{activeMeet.courseName}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>
                  {backendTimestampToDate(
                    activeMeet.startDate
                  )?.toLocaleDateString()}{" "}
                  -{" "}
                  {backendTimestampToDate(
                    activeMeet.endDate
                  )?.toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
        {matches.length !== 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 {...testId('select-match-round-title')} className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Select Match/Round
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matches.map((match) => (
                <button
                  key={match.id}
                  onClick={() => setSelectedMatch(match)}
                  {...testId(match.playFormat === "singles" ? 'singles-match-button' : 'doubles-match-button')}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedMatch?.id === match.id
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600"
                  }`}
                >
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {match.name}
                  </h4>
                  <div className="space-x-5 flex flex-row text-sm text-gray-600 dark:text-gray-400">
                    {currentMeet?.courseName && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3" />
                        <span>{currentMeet.courseName}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <Users className="h-3 w-3" />
                      <span>{match.playersPerHole} players/hole</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {matches.length === 0 ? (
        <div {...testId('no-matches-configured-container')} className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
          <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Matches Configured
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Configure matches for this meet first before setting up players and
            pairings.
          </p>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Go to <strong>Meets</strong> tab → Configure Meet → Add matches to
              get started.
            </p>
          </div>
        </div>
      ) : (
        <>
          {selectedMatch && (
            <>
              {/* Tab Navigation */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="border-b border-gray-200 dark:border-gray-700">
                  <nav className="flex space-x-8 px-6" aria-label="Tabs">
                    <button
                      onClick={() => setActiveTab("players")}
                      {...testId('player-selection-tab')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                        activeTab === "players"
                          ? "border-green-500 text-green-600 dark:text-green-400"
                          : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300"
                      }`}
                    >
                      <Users className="h-4 w-4" />
                      <span>Player Selection</span>
                    </button>
                    <button
                      onClick={() => setActiveTab("pairings")}
                      {...testId('hole-pairings-tab')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                        activeTab === "pairings"
                          ? "border-green-500 text-green-600 dark:text-green-400"
                          : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300"
                      }`}
                    >
                      <Target className="h-4 w-4" />
                      <span>Hole Pairings</span>
                    </button>
                  </nav>
                </div>

                <div className="p-6">
                  {activeTab === "players" && matchSetup && (
                    <PlayerSelection
                      {...testId('player-selection-component')}
                      match={selectedMatch}
                      members={activeMembers}
                      matchSetup={matchSetup}
                      onUpdate={handlePlayerSelectionUpdate}
                      meet={currentMeet}
                    />
                  )}
                  {activeTab === "pairings" && matchSetup && (
                    <>
                      {selectedMatch.playFormat === "singles" ? (
                        <SinglesPlayerPairings
                          {...testId('singles-pairings-component')}
                          match={selectedMatch}
                          matchSetup={matchSetup}
                          pairings={pairings}
                          onUpdate={handlePairingsUpdate}
                          members={activeMembers}
                        />
                      ) : (
                        <DoublesPlayerPairings
                          {...testId('doubles-pairings-component')}
                          match={selectedMatch}
                          matchSetup={matchSetup}
                          pairings={pairings}
                          onUpdate={handlePairingsUpdate}
                          members={activeMembers}
                        />
                      )}
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};
