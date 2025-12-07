"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Bug, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { uploadBugScreenshotClient } from "@/lib/supabase/storage-client";


import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const bugReportSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
});

type BugReportFormValues = z.infer<typeof bugReportSchema>;

interface ReportBugDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReportBugDialog({ open, onOpenChange }: ReportBugDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BugReportFormValues>({
    resolver: zodResolver(bugReportSchema),
    defaultValues: {
      title: "",
      description: "",
      severity: "LOW",
    },
  });

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      reset();
      setSelectedImage(null);
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
      }
    }
  }, [open, reset, imagePreview]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = (values: BugReportFormValues) => {
    startTransition(async () => {
      try {
        // 1. Create the bug report first to get the ID
        const { data: reportData, error: reportError } = await supabase
          .from("bug_reports")
          .insert({
            title: values.title,
            description: values.description,
            severity: values.severity,
            device_info: {
              userAgent: navigator.userAgent,
              pathname: window.location.pathname,
            },
            status: "OPEN",
          })
          .select()
          .single();

        if (reportError) {
          console.error("Supabase Report Insert Error:", {
            message: reportError.message,
            details: reportError.details,
            hint: reportError.hint,
            code: reportError.code
          });
          throw reportError;
        }

        let screenshotUrl = null;

        // 2. Upload image if selected
        if (selectedImage && reportData) {
          const { data: uploadData, error: uploadError } = await uploadBugScreenshotClient(
            reportData.id,
            selectedImage,
            `screenshot.${selectedImage.name.split('.').pop()}`
          );

          if (uploadError) {
            console.error("Failed to upload screenshot", uploadError);
            toast.error("Bug reported, but screenshot upload failed.");
          } else if (uploadData?.publicUrl) {
            screenshotUrl = uploadData.publicUrl;

            // 3. Update report with screenshot URL
            const { error: updateError } = await supabase
              .from("bug_reports")
              .update({ screenshot_url: screenshotUrl })
              .eq("id", reportData.id);

            if (updateError) {
              console.error("Failed to update report with screenshot", updateError);
            }
          }
        }

        toast.success("Bug report submitted successfully! Thank you for your feedback.");
        onOpenChange(false);
      } catch (error) {
        console.error("Failed to submit bug report:", error);
        toast.error("Failed to submit bug report. Please try again.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Report a Bug
          </DialogTitle>
          <DialogDescription>
            Found an issue? Let us know so we can fix it.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Title
            </label>
            <Input
              id="title"
              placeholder="Brief summary of the issue"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-sm font-medium text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="severity" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Severity
            </label>
            <div className="relative">
              <select
                id="severity"
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                {...register("severity")}
              >
                <option value="LOW">Low - Minor cosmetic issue</option>
                <option value="MEDIUM">Medium - Feature not working as expected</option>
                <option value="HIGH">High - Feature broken / Cannot use app</option>
                <option value="CRITICAL">Critical - Data loss / Security issue</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
                <svg
                  className="h-4 w-4 fill-current"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
            {errors.severity && (
              <p className="text-sm font-medium text-destructive">{errors.severity.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Description
            </label>
            <Textarea
              id="description"
              placeholder="Please emphasize details on what happened..."
              className="resize-none min-h-[100px]"
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm font-medium text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Screenshot (Optional)
            </label>

            {!imagePreview ? (
              <div
                className="border-2 border-dashed rounded-md p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground text-center">
                  Click to upload a screenshot
                  <br />
                  <span className="text-xs text-muted-foreground/70">(Max 5MB)</span>
                </p>
              </div>
            ) : (
              <div className="relative rounded-md overflow-hidden border aspect-video group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage();
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageSelect}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Report
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
