import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { post } from "@/lib/api";
import { parseFlexible } from "@/lib/utils";

export function CreateBountyDialog({ setIsCreateModalOpen }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      name: "",
      description: "",
      prize: "",
      expiresAt: "",
      tags: "",
      difficulty: "Medium",
      type: "Funded",
      expectedOutput: "",
    },
  });

  const onSubmit = async (data) => {
    console.log("Form submitted:", data);

    try {
      const payload = {
        ...data,
        prize: {
          amount: Number(data.prize),
          distribution: "winner-takes-all",
          currency: "ETH",
        },
        expectedOutput: {
          format: "json",
          schema: parseFlexible(data.expectedOutput),
        },
        evaluationCriteria: {
          type: "automated",
          criteria: "Correlation with Actual Market Movements",
        },
        status: "draft",
        expiresAt: new Date(data.expiresAt).toISOString(),
        type: data.type.toLowerCase(),
        tags: data.tags.split(",").map((tag: string) => tag.trim()),
      };

      await post("bounty/create", payload);
      toast("Your bounty has been successfully created.");
      reset();
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to create bounty");
    }
  };

  return (
    <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Create New Bounty</DialogTitle>
        <DialogDescription>
          Fill in the details to create a new bounty for the community.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="name"
              placeholder="Enter bounty title"
              {...register("name", { required: "Title is required" })}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what needs to be done"
              rows={4}
              {...register("description", {
                required: "Description is required",
              })}
            />
            {errors.description && (
              <p className="text-sm text-red-500">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="reward">Reward (ETH)</Label>
              <Input
                id="reward"
                placeholder="0.00"
                type="number"
                step="0.01"
                {...register("prize", {
                  required: "Reward is required",
                  min: { value: 0.01, message: "Minimum reward is 0.01 ETH" },
                })}
              />
              {errors.prize && (
                <p className="text-sm text-red-500">{errors.prize.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="deadline">Deadline</Label>
              <Input
                id="deadline"
                type="date"
                {...register("expiresAt", { required: "Deadline is required" })}
              />
              {errors.expiresAt && (
                <p className="text-sm text-red-500">
                  {errors.expiresAt.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input
              id="tags"
              placeholder="e.g., Design, Smart Contract, Security"
              {...register("tags")}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="difficulty">Difficulty</Label>
            <Select defaultValue="Medium" {...register("difficulty")}>
              <SelectTrigger>
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Easy">Easy</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="type">Type</Label>
            <Select defaultValue="Funded" {...register("type")}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Funded">Funded</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="expectedOutput">Expected Output</Label>
            <Textarea
              id="expectedOutput"
              placeholder="JSON Schema that outputs needs to correspond to"
              rows={4}
              {...register("expectedOutput")}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsCreateModalOpen(false)}
          >
            Cancel
          </Button>
          <Button type="submit">Create Bounty</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
