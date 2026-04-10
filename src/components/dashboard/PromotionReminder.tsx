import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, X } from "lucide-react";
import { useState } from "react";

interface PromotionReminderProps {
  listingType: "product" | "service" | "event";
}

export function PromotionReminder({ listingType }: PromotionReminderProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const typeLabel = listingType === "product" ? "product" : listingType === "service" ? "service" : "event";

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium mb-1">Boost Your Visibility 🚀</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Did you know you can boost your {typeLabel}'s visibility and increase sales by promoting it? 
              Reach more potential customers and stand out from the competition. 
              Use the <strong>Promote</strong> button on your listing to get started.
            </p>
          </div>
          <button onClick={() => setDismissed(true)} className="p-1 hover:bg-muted rounded shrink-0">
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
