import React from "react";
import { Component } from "components/ui/lightning";

const DemoOne = () => {
  return (
    <div className="flex w-full min-h-screen justify-center items-center bg-gray-900 p-4">
      <div className="w-full max-w-4xl h-[600px] rounded-lg overflow-hidden shadow-2xl bg-black">
        <Component
          hue={220}
          xOffset={0.0}
          speed={0.7}
          intensity={1.2}
          size={1.5}
        />
      </div>
    </div>
  );
};

export { DemoOne };
