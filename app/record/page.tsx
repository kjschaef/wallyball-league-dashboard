"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Calendar } from "../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { CalendarIcon, Plus, Minus } from "lucide-react";
import { cn } from "../lib/utils";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../components/ui/form";
import { PlayerSelector } from "../components/PlayerSelector";

const gameFormSchema = z.object({
  date: z.date(),
  teamOnePlayerOneId: z.number().optional().nullable(),
  teamOnePlayerTwoId: z.number().optional().nullable(),
  teamOnePlayerThreeId: z.number().optional().nullable(),
  teamTwoPlayerOneId: z.number().optional().nullable(),
  teamTwoPlayerTwoId: z.number().optional().nullable(),
  teamTwoPlayerThreeId: z.number().optional().nullable(),
  teamOneGamesWon: z.number().min(0),
  teamTwoGamesWon: z.number().min(0),
});

type GameFormValues = z.infer<typeof gameFormSchema>;

export default function RecordMatch() {
  const router = useRouter();
  const [teamOnePlayers, setTeamOnePlayers] = useState<number[]>([]);
  const [teamTwoPlayers, setTeamTwoPlayers] = useState<number[]>([]);

  const { data: players = [] } = useQuery({
    queryKey: ["/api/players"],
    queryFn: () => fetch("/api/players").then(res => res.json())
  });

  const form = useForm<GameFormValues>({
    resolver: zodResolver(gameFormSchema),
    defaultValues: {
      date: new Date(),
      teamOnePlayerOneId: null,
      teamOnePlayerTwoId: null,
      teamOnePlayerThreeId: null,
      teamTwoPlayerOneId: null,
      teamTwoPlayerTwoId: null,
      teamTwoPlayerThreeId: null,
      teamOneGamesWon: 0,
      teamTwoGamesWon: 0,
    },
  });

  const onSubmit = async (data: GameFormValues) => {
    try {
      const formData = {
        ...data,
        teamOnePlayerOneId: teamOnePlayers[0] || null,
        teamOnePlayerTwoId: teamOnePlayers[1] || null,
        teamOnePlayerThreeId: teamOnePlayers[2] || null,
        teamTwoPlayerOneId: teamTwoPlayers[0] || null,
        teamTwoPlayerTwoId: teamTwoPlayers[1] || null,
        teamTwoPlayerThreeId: teamTwoPlayers[2] || null,
      };

      await fetch("/api/games", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      router.push("/dashboard");
    } catch (error) {
      console.error("Error recording match:", error);
    }
  };

  const handleTeamOnePlayerSelect = (playerId: number) => {
    setTeamOnePlayers((prev) => {
      if (prev.includes(playerId)) {
        return prev.filter((id) => id !== playerId);
      }
      
      if (teamTwoPlayers.includes(playerId)) {
        setTeamTwoPlayers((prev) => prev.filter((id) => id !== playerId));
      }
      
      if (prev.length < 3) {
        return [...prev, playerId];
      }
      
      return prev;
    });
  };

  const handleTeamTwoPlayerSelect = (playerId: number) => {
    setTeamTwoPlayers((prev) => {
      if (prev.includes(playerId)) {
        return prev.filter((id) => id !== playerId);
      }
      
      if (teamOnePlayers.includes(playerId)) {
        setTeamOnePlayers((prev) => prev.filter((id) => id !== playerId));
      }
      
      if (prev.length < 3) {
        return [...prev, playerId];
      }
      
      return prev;
    });
  };

  const incrementTeamOneScore = () => {
    const currentValue = form.getValues("teamOneGamesWon");
    form.setValue("teamOneGamesWon", currentValue + 1);
  };

  const decrementTeamOneScore = () => {
    const currentValue = form.getValues("teamOneGamesWon");
    if (currentValue > 0) {
      form.setValue("teamOneGamesWon", currentValue - 1);
    }
  };

  const incrementTeamTwoScore = () => {
    const currentValue = form.getValues("teamTwoGamesWon");
    form.setValue("teamTwoGamesWon", currentValue + 1);
  };

  const decrementTeamTwoScore = () => {
    const currentValue = form.getValues("teamTwoGamesWon");
    if (currentValue > 0) {
      form.setValue("teamTwoGamesWon", currentValue - 1);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Record Match</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Match Date</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-[240px] pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Team One</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Select Players</h3>
                  <PlayerSelector
                    players={players}
                    selectedPlayers={teamOnePlayers}
                    onSelect={handleTeamOnePlayerSelect}
                  />
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2">Games Won</h3>
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={decrementTeamOneScore}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <FormField
                      control={form.control}
                      name="teamOneGamesWon"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              className="text-center"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={incrementTeamOneScore}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Team Two</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Select Players</h3>
                  <PlayerSelector
                    players={players}
                    selectedPlayers={teamTwoPlayers}
                    onSelect={handleTeamTwoPlayerSelect}
                  />
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2">Games Won</h3>
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={decrementTeamTwoScore}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <FormField
                      control={form.control}
                      name="teamTwoGamesWon"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              className="text-center"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={incrementTeamTwoScore}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard")}
            >
              Cancel
            </Button>
            <Button type="submit">Record Match</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
