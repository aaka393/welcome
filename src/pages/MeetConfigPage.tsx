import React, { useState, useMemo } from "react";
import { Layout } from "../components/Layout";
import { CourseForm } from "../components/CourseForm";
import { CourseDetailsView } from "../components/CourseDetailsView";
import { CourseList } from "../components/CourseList";
import { MatchList } from "../components/MatchList";
import { MatchForm } from "../components/MatchForm";
import { PrizeList } from "../components/PrizeList";
import { PrizeForm } from "../components/PrizeForm";
import { useAdminStore } from "../stores/useAdminStore";
import { Match, Course, Prize } from "../types/index";
import { ArrowLeft, Plus } from "lucide-react";
import { backendTimestampToDateOnly } from "../utils/date-utils";
import { useCommonDataStore } from "../stores/useCommonDataStore";
import { useCourseStore } from "../stores/useCourseStore";
import { useMatchStore } from "../stores/useMatchStore";
import { usePrizeStore } from "../stores/usePrizeStore";

export const MeetConfigPage: React.FC = () => {
  const { selectedMeetId, setCurrentView, setSelectedMeetId } = useAdminStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [viewingCourse, setViewingCourse] = useState<Course | null>(null);
  const [showPrizeForm, setShowPrizeForm] = useState(false);
  const [editingPrize, setEditingPrize] = useState<Prize | null>(null);

  const {
    matchesLoading: loading,
    meets,
    matches,
    courses,
    prizes,
    loadCourses,
  } = useCommonDataStore();
  const { createCourse, updateCourse, deleteCourse } = useCourseStore();
  const { createMatch, updateMatch, deleteMatch } = useMatchStore();
  const { createPrize, updatePrize, deletePrize } = usePrizeStore();
  const meet = useMemo(() => {
    return meets.find((m) => m.id === selectedMeetId) || null;
  }, [meets, selectedMeetId]);
  const filteredMatches = useMemo(
    () => matches.filter((match) => match.meetId === selectedMeetId),
    [matches, selectedMeetId]
  );

  const handleBack = () => {
    setCurrentView("dashboard");
    setSelectedMeetId(null);
  };

  const handleDeleteMatch = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this match?")) {
      try {
        await deleteMatch(id);
      } catch (error) {
        console.error("Failed to delete match:", error);
      }
    }
  };

  const handleEditMatch = (match: Match) => {
    setEditingMatch(match);
    setShowAddForm(true);
  };

  const handleSaveMatch = async (matchData: Omit<Match, "id">) => {
    try {
      if (editingMatch) {
        await updateMatch(editingMatch.id, matchData);
      } else {
        await createMatch({
          ...matchData,
          meetId: selectedMeetId!,
        });
      }
      setShowAddForm(false);
      setEditingMatch(null);
    } catch (error) {
      console.error("Failed to save match:", error);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this course?")) {
      try {
        await deleteCourse(id);
      } catch (error) {
        console.error("Failed to delete course:", error);
      }
    }
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setShowCourseForm(true);
  };

  const handleViewCourse = (course: Course) => {
    setViewingCourse(course);
  };

  const handleSaveCourse = async (courseData: Omit<Course, "id">) => {
    try {
      if (editingCourse) {
        await updateCourse(editingCourse.id, courseData);
      } else {
        await createCourse({
          ...courseData,
          meetId: selectedMeetId!,
        });
      }
      setShowCourseForm(false);
      setEditingCourse(null);
      await loadCourses(selectedMeetId!);
    } catch (error) {
      console.error("Failed to save course:", error);
    }
  };

  const handleDeletePrize = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this prize?")) {
      try {
        await deletePrize(id);
      } catch (error) {
        console.error("Failed to delete prize:", error);
      }
    }
  };

  const handleEditPrize = (prize: Prize) => {
    setEditingPrize(prize);
    setShowPrizeForm(true);
  };

  const handleSavePrize = async (prizeData: Omit<Prize, "id">) => {
    try {
      if (editingPrize) {
        await updatePrize(editingPrize.id, prizeData);
      } else {
        await createPrize({
          ...prizeData,
          meetId: selectedMeetId!,
        });
      }
      setShowPrizeForm(false);
      setEditingPrize(null);
    } catch (error) {
      console.error("Failed to save prize:", error);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </Layout>
    );
  }

  if (!meet) {
    return (
      <Layout>
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">Meet not found</p>
          <button
            onClick={handleBack}
            className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center space-x-4 mb-4">
            <button
              aria-label="Back to Dashboard"
              onClick={handleBack}
              className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Configure Meet: {meet.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {meet.courseName} •{" "}
                {backendTimestampToDateOnly(
                  meet.startDate
                )?.toLocaleDateString()}{" "}
                -{" "}
                {backendTimestampToDateOnly(meet.endDate)?.toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Courses Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Courses
            </h2>
            <button
              onClick={() => {
                setEditingCourse(null);
                setShowCourseForm(true);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Course</span>
            </button>
          </div>

          {showCourseForm && (
            <CourseForm
              course={editingCourse}
              onSave={handleSaveCourse}
              onCancel={() => {
                setShowCourseForm(false);
                setEditingCourse(null);
              }}
            />
          )}

          {viewingCourse && (
            <CourseDetailsView
              course={viewingCourse}
              onClose={() => setViewingCourse(null)}
              onEdit={() => {
                setEditingCourse(viewingCourse);
                setShowCourseForm(true);
                setViewingCourse(null);
              }}
            />
          )}

          <CourseList
            courses={courses}
            onEdit={handleEditCourse}
            onDelete={handleDeleteCourse}
            onView={handleViewCourse}
          />
        </div>

        {/* Prizes Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Prizes
            </h2>
            <button
              onClick={() => {
                setEditingPrize(null);
                setShowPrizeForm(true);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Prize</span>
            </button>
          </div>

          {showPrizeForm && (
            <PrizeForm
              prize={editingPrize}
              onSave={handleSavePrize}
              onCancel={() => {
                setShowPrizeForm(false);
                setEditingPrize(null);
              }}
            />
          )}

          <PrizeList
            prizes={prizes}
            onEdit={handleEditPrize}
            onDelete={handleDeletePrize}
          />
        </div>

        {/* Matches Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Matches
            </h2>
            <button
              onClick={() => {
                setEditingMatch(null);
                setShowAddForm(true);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Match</span>
            </button>
          </div>

          {showAddForm && (
            <MatchForm
              match={editingMatch}
              availableCourses={courses.map((course) => course.name)}
              onSave={handleSaveMatch}
              onCancel={() => {
                setShowAddForm(false);
                setEditingMatch(null);
              }}
            />
          )}

          <MatchList
            matches={filteredMatches}
            onEdit={handleEditMatch}
            onDelete={handleDeleteMatch}
          />
        </div>
      </div>
    </Layout>
  );
};
