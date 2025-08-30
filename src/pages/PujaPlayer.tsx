import React from "react";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import Layout from "../components/Layout/Layout";
import Button from "../components/UI/Button";
import { VideoPlayer } from "../components/Player/VideoPlayer";

const PujaPlayer: React.FC = () => {
  return (
    <Layout>
      <div className="max-w-5xl mx-auto w-full px-4 py-4">
        <Link to="/">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <ChevronLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </Link>
      </div>
      <VideoPlayer />
    </Layout>
  );
};

export default PujaPlayer;
