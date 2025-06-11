import React from 'react';

interface WelcomeProps {
  name: string;
}

const Welcome: React.FC<WelcomeProps> = ({ name }) => {
  return (
    <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white p-6 rounded-lg shadow-md text-center">
      <h2 className="text-2xl font-semibold mb-2">Welcome, {name}!</h2>
      <p className="text-md">We're glad to have you.</p>
    </div>
  );
};

export default Welcome;
