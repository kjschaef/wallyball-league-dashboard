
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Minus } from "lucide-react";

const formSchema = z.object({
  playerId: z.string(),
  won: z.coerce.number().min(0),
  lost: z.coerce.number().min(0),
});

type FormData = z.infer<typeof formSchema>;

export default function RecordMatch() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: players } = useQuery<any[]>({
    queryKey: ["/api/players"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      playerId: "",
      won: 0,
      lost: 0,
    },
  });

  const mutation = useMutation({
    mutationFn: (values: FormData) =>
      fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: parseInt(values.playerId),
          won: values.won,
          lost: values.lost,
        }),
      }).then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      form.reset();
      toast({ title: "Match recorded successfully" });
    },
  });

  const onSubmit = (values: FormData) => {
    mutation.mutate(values);
  };

  const incrementField = (field: keyof FormData) => {
    const currentValue = form.getValues(field);
    form.setValue(field, currentValue + 1);
  };

  const decrementField = (field: keyof FormData) => {
    const currentValue = form.getValues(field);
    form.setValue(field, Math.max(0, currentValue - 1));
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Record Match</h1>

      <Card className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="playerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Player</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a player" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {players?.map((player) => (
                        <SelectItem
                          key={player.id}
                          value={player.id.toString()}
                        >
                          {player.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="won"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sets Won</FormLabel>
                  <div className="flex items-center gap-2">
                    <Button 
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-10 w-10"
                      onClick={() => decrementField('won')}
                    >
                      <Minus className="h-6 w-6" />
                    </Button>
                    <FormControl>
                      <Input type="number" min="0" {...field} className="text-center text-lg" />
                    </FormControl>
                    <Button 
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-10 w-10"
                      onClick={() => incrementField('won')}
                    >
                      <Plus className="h-6 w-6" />
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sets Lost</FormLabel>
                  <div className="flex items-center gap-2">
                    <Button 
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-10 w-10"
                      onClick={() => decrementField('lost')}
                    >
                      <Minus className="h-6 w-6" />
                    </Button>
                    <FormControl>
                      <Input type="number" min="0" {...field} className="text-center text-lg" />
                    </FormControl>
                    <Button 
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-10 w-10"
                      onClick={() => incrementField('lost')}
                    >
                      <Plus className="h-6 w-6" />
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">
              Record Match
            </Button>
          </form>
        </Form>
      </Card>
    </div>
  );
}
