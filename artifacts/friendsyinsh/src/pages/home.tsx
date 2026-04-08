import { useLocation } from "wouter";
import { useCreateGame } from "@workspace/api-client-react";
import { useState } from "react";

export default function Home() {
  const [, setLocation] = useLocation();
  const createGame = useCreateGame();
  const [error, setError] = useState<string | null>(null);

  function handleCreate() {
    setError(null);
    createGame.mutate(
      {},
      {
        onSuccess: (room) => {
          const myColor = Math.random() < 0.5 ? "white" : "black";
          setLocation(`/game/${room.id}/${myColor}`);
        },
        onError: () => {
          setError("Could not create a game. Please try again.");
        },
      }
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-10">
        <div className="space-y-4">
          <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground font-medium">
            Abstract Strategy
          </div>
          <h1
            className="text-6xl font-serif font-semibold tracking-tight"
            style={{ color: "hsl(38, 92%, 55%)" }}
          >
            YINSH
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Play with a friend over a shared link.<br />
            No registration. No waiting.
          </p>
        </div>

        <div className="space-y-4">
          <button
            data-testid="button-create-game"
            onClick={handleCreate}
            disabled={createGame.isPending}
            className="w-full py-4 px-8 rounded-lg text-base font-semibold transition-all duration-200"
            style={{
              backgroundColor: "hsl(38, 92%, 55%)",
              color: "hsl(220, 25%, 8%)",
              opacity: createGame.isPending ? 0.7 : 1,
            }}
          >
            {createGame.isPending ? "Creating..." : "Create Online Game"}
          </button>

          <button
            onClick={() => setLocation("/play")}
            className="w-full py-4 px-8 rounded-lg text-base font-semibold border-2 transition-all duration-200"
            style={{
              borderColor: "hsl(142, 76%, 36%)",
              color: "hsl(142, 76%, 36%)",
              backgroundColor: "transparent",
            }}
          >
            More Game Modes
          </button>

          {error && (
            <p data-testid="text-error" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>

        <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
          <p>Create a room and share the link with your friend.</p>
          <p>First to capture 3 rings wins.</p>
          <p className="pt-2 text-emerald-400">
            Try our new <strong>Hot-Seat mode</strong> for playing on the same device!
          </p>
        </div>
      </div>
    </div>
  );
}
