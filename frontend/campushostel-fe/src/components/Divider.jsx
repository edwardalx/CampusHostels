import React from "react";

export default function Divider({ text }) {
  return (
    <div className="flex items-center my-2">
      <div className="flex-1 border-t border-teal-600"></div>
      <span className="px-4 text-gray-300 text-xl">{text}</span>
      <div className="flex-1 border-t border-teal-600"></div>
    </div>
  );
}
