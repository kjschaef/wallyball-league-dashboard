"use client";

import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "./ui/button";
import Link from "next/link";

export function FloatingActionButton({ onRecordGame }: { onRecordGame?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="absolute bottom-16 right-0 flex flex-col gap-2 items-end mb-2">
          <Button
            onClick={() => {
              if (onRecordGame) {
                onRecordGame();
                setIsOpen(false);
              }
            }}
            className="rounded-full h-12 px-4 flex items-center gap-2 shadow-lg"
          >
            Record Match
          </Button>
          <Link href="/players">
            <Button
              className="rounded-full h-12 px-4 flex items-center gap-2 shadow-lg"
            >
              Manage Players
            </Button>
          </Link>
        </div>
      )}
      <Button
        onClick={toggleMenu}
        className="rounded-full h-14 w-14 shadow-lg"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </Button>
    </div>
  );
}
