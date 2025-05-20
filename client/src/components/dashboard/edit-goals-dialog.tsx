import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GoalsData {
  charitable: number;
  vegan: number;
  media: number;
  campaigns: number;
}

interface EditGoalsDialogProps {
  currentGoals: GoalsData;
  onSaveGoals: (goals: GoalsData) => void;
}

export function EditGoalsDialog({ currentGoals, onSaveGoals }: EditGoalsDialogProps) {
  const [open, setOpen] = useState(false);
  const [goals, setGoals] = useState<GoalsData>(currentGoals);
  const { toast } = useToast();

  const handleChange = (key: keyof GoalsData, value: string) => {
    const numValue = parseInt(value) || 0;
    setGoals(prev => ({ ...prev, [key]: numValue }));
  };

  const handleSubmit = () => {
    onSaveGoals(goals);
    setOpen(false);
    toast({
      title: "Goals updated",
      description: "Your impact goals have been updated successfully.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Edit className="h-4 w-4" />
          <span>Edit Goals</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Your Impact Goals</DialogTitle>
          <DialogDescription>
            Set target numbers of animals saved for each impact category.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="charitable" className="text-right">
              Charitable
            </Label>
            <Input
              id="charitable"
              type="number"
              min="1"
              className="col-span-3"
              value={goals.charitable}
              onChange={(e) => handleChange("charitable", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="conversions" className="text-right">
              Conversions
            </Label>
            <Input
              id="conversions"
              type="number"
              min="1"
              className="col-span-3"
              value={goals.vegan}
              onChange={(e) => handleChange("vegan", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sharing" className="text-right">
              Sharing
            </Label>
            <Input
              id="sharing"
              type="number"
              min="1"
              className="col-span-3"
              value={goals.media}
              onChange={(e) => handleChange("media", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="campaigns" className="text-right">
              Campaigns
            </Label>
            <Input
              id="campaigns"
              type="number"
              min="1"
              className="col-span-3"
              value={goals.campaigns}
              onChange={(e) => handleChange("campaigns", e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}