
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

interface FloatingActionButtonProps {
  onRecordMatch: () => void;
}

export function FloatingActionButton({ onRecordMatch }: FloatingActionButtonProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={onRecordMatch}
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110"
        title="Record New Match"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}
