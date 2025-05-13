"use client";

import React from "react";
import { Check } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";

interface PlayerSelectorProps {
  players: any[];
  selectedPlayers: number[];
  onSelect: (playerId: number) => void;
}

export function PlayerSelector({ players, selectedPlayers, onSelect }: PlayerSelectorProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
      {players.map((player) => (
        <Button
          key={player.id}
          type="button"
          variant={selectedPlayers.includes(player.id) ? "default" : "outline"}
          className={cn(
            "h-auto py-2 px-3 justify-start text-left font-normal",
            selectedPlayers.includes(player.id) && "bg-primary text-primary-foreground"
          )}
          onClick={() => onSelect(player.id)}
        >
          <div className="flex items-center gap-2">
            {selectedPlayers.includes(player.id) && (
              <Check className="h-4 w-4 flex-shrink-0" />
            )}
            <span className="truncate">{player.name}</span>
          </div>
        </Button>
      ))}
    </div>
  );
}
