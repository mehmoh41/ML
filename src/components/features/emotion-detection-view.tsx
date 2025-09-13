"use client";

import { enhanceEmotionDetection } from "@/ai/flows/enhance-emotion-detection";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Loader2, Smile, Sparkles, User, Webcam } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import WebcamView from "../shared/webcam-view";

const emotions = ["Happy", "Sad", "Neutral", "Surprised"];
const emotionIcons: { [key: string]: React.ReactNode } = {
  Happy: "😄",
  Sad: "😢",
  Neutral: "😐",
  Surprised: "😲",
};

const formSchema = z.object({
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
});

export default function EmotionDetectionView() {
  const { toast } = useToast();
  const [detectedEmotion, setDetectedEmotion] = useState("Neutral");
  const [samples, setSamples] = useState<{ [key: string]: number }>({
    Happy: 0,
    Sad: 0,
    Neutral: 0,
    Surprised: 0,
  });

  const [aiResult, setAiResult] = useState<{
    enhancedAccuracy: number;
    reasoning: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
    },
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * emotions.length);
      setDetectedEmotion(emotions[randomIndex]);
    }, 2000); // Change emotion every 2 seconds
    return () => clearInterval(interval);
  }, []);

  const handleCapture = (emotion: string) => {
    setSamples((prev) => ({ ...prev, [emotion]: prev[emotion] + 1 }));
    toast({
      title: "Sample Captured!",
      description: `Added one sample for '${emotion}'.`,
    });
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    setAiResult(null);
    try {
      const result = await enhanceEmotionDetection({
        emotion: detectedEmotion,
        description: values.description,
        currentAccuracy: 0.85, // Dummy value
      });
      setAiResult(result);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "An error occurred.",
        description: "Failed to get enhancement from AI.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="flex flex-col gap-8 lg:col-span-2">
        <Card className="overflow-hidden shadow-lg">
          <CardHeader className="bg-muted/30">
            <CardTitle className="flex items-center gap-2">
              <Webcam className="text-primary" />
              Live Feed
            </CardTitle>
            <CardDescription>
              The model is analyzing the video feed in real-time.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative aspect-video">
              <WebcamView />
              <div className="absolute bottom-4 right-4 flex items-center gap-4 rounded-lg bg-background/80 p-4 shadow-md backdrop-blur-sm">
                <span className="text-5xl">
                  {emotionIcons[detectedEmotion]}
                </span>
                <div>
                  <p className="text-sm text-muted-foreground">Detected Emotion</p>
                  <p className="text-2xl font-bold font-headline text-foreground">
                    {detectedEmotion}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="text-primary" />
              Model Training
            </CardTitle>
            <CardDescription>
              Improve the model by providing more examples. Click the buttons below to capture your expression for each emotion.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {emotions.map((emotion) => (
              <div key={emotion} className="flex flex-col items-center gap-2">
                <p className="font-medium">
                  {emotion} ({samples[emotion]})
                </p>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={() => handleCapture(emotion)}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Capture
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1">
        <Card className="sticky top-20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="text-accent" />
              Enhance with AI
            </CardTitle>
            <CardDescription>
              Use GenAI to understand how textual descriptions can improve model accuracy.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <Label className="font-medium">Current Emotion</Label>
                  <Input
                    readOnly
                    value={detectedEmotion}
                    className="mt-2"
                  />
                </div>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emotion Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={`e.g., "A happy face often has raised cheeks, and corners of the mouth pulled back and up."`}
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Describe the '{detectedEmotion}' emotion in detail.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Enhance Detection
                </Button>
              </form>
            </Form>
          </CardContent>
          {aiResult && (
            <CardFooter className="flex flex-col items-start gap-4 border-t pt-6">
              <CardTitle className="text-lg">AI Analysis Result</CardTitle>
              <div className="w-full">
                <p className="text-sm font-medium text-muted-foreground">Potential Enhanced Accuracy</p>
                <p className="font-headline text-2xl font-bold text-primary">
                  {(aiResult.enhancedAccuracy * 100).toFixed(1)}%
                </p>
              </div>
              <div className="w-full">
                <p className="text-sm font-medium text-muted-foreground">Reasoning</p>
                <p className="text-sm">{aiResult.reasoning}</p>
              </div>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
