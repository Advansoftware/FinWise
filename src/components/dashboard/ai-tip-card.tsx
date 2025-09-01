"use client";

import { useState, useEffect, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, RefreshCw } from "lucide-react";
import { getSpendingTip } from "@/app/actions";
import { Skeleton } from "../ui/skeleton";

export function AITipCard() {
  const [tip, setTip] = useState("");
  const [isPending, startTransition] = useTransition();

  const fetchTip = () => {
    startTransition(async () => {
      const newTip = await getSpendingTip();
      setTip(newTip);
    });
  };

  useEffect(() => {
    fetchTip();
  }, []);

  return (
    <Card className="bg-accent/20 border-accent/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-accent" />
            <CardTitle className="text-lg text-primary">AI-Powered Spending Tip</CardTitle>
        </div>
        <Button
            variant="ghost"
            size="icon"
            onClick={fetchTip}
            disabled={isPending}
            className="text-accent hover:bg-accent/20 hover:text-accent"
        >
            <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {isPending && !tip ? (
           <div className="space-y-2 pt-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : (
          <p className="text-primary/90 pt-2">
            {tip}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
