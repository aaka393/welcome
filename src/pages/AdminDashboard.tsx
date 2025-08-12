import React from "react";
import { Layout } from "../components/Layout";
import { MeetGrid } from "../components/MeetGrid";
import { CurrentMeetManagement } from "../components/CurrentMeetManagement";
import { ScoresManagement } from "../components/ScoresManagement";
import { LeaderboardManagement } from "../components/LeaderboardManagement";
import { MeetConfigPage } from "./MeetConfigPage";
import { useAdminStore } from "../stores/useAdminStore";
import { Users, Calendar, Trophy, Target, Award } from "lucide-react";
import { MemberMgmt } from "../components/MemberMgmt";
import { useCommonDataStore } from "../stores/useCommonDataStore";
import { testId } from "../utils/testId";

export const AdminDashboard: React.FC = () => {
  const { activeTab, setActiveTab, currentView } = useAdminStore();

  const { loadAllData } = useCommonDataStore();
  React.useEffect(() => {
    loadAllData(false);
  }, [loadAllData]);

  if (currentView === "meet-config") {
    return <MeetConfigPage />;
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage golf club members and upcoming meets
          </p>
        </div> */}

        {/* Navigation Tabs */}
        <div
          className="bg-white dark:bg-gray-800 rounded-lg shadow"
          {...testId("admin-dashboard-tabs")}
        >
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab("members")}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                  activeTab === "members"
                    ? "border-green-500 text-green-600 dark:text-green-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300"
                }`}
                {...testId("members-tab")}
              >
                <Users className="h-4 w-4" />
                <span>Members</span>
              </button>
              <button
                onClick={() => setActiveTab("meets")}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                  activeTab === "meets"
                    ? "border-green-500 text-green-600 dark:text-green-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300"
                }`}
                {...testId("meets-tab")}
              >
                <Calendar className="h-4 w-4" />
                <span>Meets</span>
              </button>
              <button
                onClick={() => setActiveTab("current-meet")}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                  activeTab === "current-meet"
                    ? "border-green-500 text-green-600 dark:text-green-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300"
                }`}
                {...testId("current-meet-tab")}
              >
                <Trophy className="h-4 w-4" />
                <span>Current Meet</span>
              </button>
              <button
                onClick={() => setActiveTab("scores")}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                  activeTab === "scores"
                    ? "border-green-500 text-green-600 dark:text-green-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300"
                }`}
                {...testId("scores-tab")}
              >
                <Target className="h-4 w-4" />
                <span>Scores</span>
              </button>
              <button
                onClick={() => setActiveTab("leaderboard")}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                  activeTab === "leaderboard"
                    ? "border-green-500 text-green-600 dark:text-green-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300"
                }`}
                {...testId("leaderboard-tab")}
              >
                <Award className="h-4 w-4" />
                <span>Leaderboard</span>
              </button>
            </nav>
          </div>

          <div
            className="p-6"
            {...testId("dashboard-content-area")}
          >
            {activeTab === "members" && (
              <MemberMgmt {...testId("members-management")} />
            )}
            {activeTab === "meets" && <MeetGrid {...testId("meet-grid")} />}
            {activeTab === "current-meet" && (
              <CurrentMeetManagement {...testId("current-meet-management")} />
            )}
            {activeTab === "scores" && (
              <ScoresManagement {...testId("scores-management")} />
            )}
            {activeTab === "leaderboard" && (
              <LeaderboardManagement {...testId("leaderboard-management")} />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};