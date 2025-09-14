"use client";

import { suggestSignLanguageGestures } from "@/ai/flows/suggest-sign-language-gestures";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { Hand, Loader2, Sparkles, Type, Webcam, Video, VideoOff } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Badge } from "../ui/badge";
import { Label } from "../ui/label";
import { Progress } from "../ui/progress";

// Extend window to include tmImage
declare global {
  interface Window {
    tmImage: any;
    tf: any;
  }
}

const URL = "/my_model/"; // Using local model

type Prediction = {
  className: string;
  probability: number;
};

const formSchema = z.object({
  desiredCapabilities: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
});

export default function SignLanguageView() {
  const { toast } = useToast();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Ready to start");
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  
  const [suggestedGestures, setSuggestedGestures] = useState<string[] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingGestures, setExistingGestures] = useState<string[]>([]);

  const webcamRef = useRef<any | null>(null);
  const modelRef = useRef<any | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      desiredCapabilities: "",
    },
  });

  const predict = useCallback(async () => {
    const model = modelRef.current;
    const webcam = webcamRef.current;
    if (model && webcam?.canvas) {
      const prediction = await model.predict(webcam.canvas);
      setPredictions(prediction);
    }
  }, []);
  
  const loop = useCallback(async () => {
    if (webcamRef.current) {
        webcamRef.current.update();
        await predict();
        animationFrameId.current = requestAnimationFrame(loop);
    }
  }, [predict]);

  const stopWebcam = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    
    const webcam = webcamRef.current;
    if (webcam && webcam.stop) {
      webcam.stop();
      webcamRef.current = null;
    }
    
    if (canvasContainerRef.current) {
        canvasContainerRef.current.innerHTML = '';
    }

    setIsWebcamActive(false);
    setStatus("Webcam stopped.");
    setPredictions([]);
  }, []);

  const startWebcam = useCallback(async () => {
    if (typeof window.tmImage === 'undefined' || typeof window.tf === 'undefined') {
      setStatus("Waiting for libraries to load...");
      setTimeout(startWebcam, 500);
      return;
    }

    try {
      setLoading(true);
      setIsWebcamActive(true);
      setStatus("Initializing...");

      const modelURL = URL + "model.json";
      const metadataURL = URL + "metadata.json";

      setStatus("Loading model...");
      if (!modelRef.current) {
        modelRef.current = await window.tmImage.load(modelURL, metadataURL);
      }
      
      const classLabels = modelRef.current.getClassLabels();
      setExistingGestures(classLabels);

      setStatus("Initializing webcam...");
      const size = 400;
      const flip = true;
      const newWebcam = new window.tmImage.Webcam(size, size, flip);
      await newWebcam.setup();
      await newWebcam.play();
      webcamRef.current = newWebcam;
      
      if (canvasContainerRef.current) {
          canvasContainerRef.current.innerHTML = ''; // Clear previous canvas if any
          canvasContainerRef.current.appendChild(newWebcam.canvas);
      }
      
      setLoading(false);
      setStatus("Ready");
      
      animationFrameId.current = requestAnimationFrame(loop);

    } catch (error) {
      console.error("Error initializing Teachable Machine:", error);
      setStatus("Error loading model. Please check permissions and refresh.");
      toast({
        variant: "destructive",
        title: "Initialization Failed",
        description: "Could not load model or access webcam.",
      });
      setIsWebcamActive(false);
      setLoading(false);
    }
  }, [loop, toast]);
  
  const handleToggleWebcam = () => {
    if (isWebcamActive) {
      stopWebcam();
    } else {
      startWebcam();
    }
  };
  
  useEffect(() => {
    return () => {
      // Full cleanup when the component unmounts
      stopWebcam();
      if (modelRef.current && modelRef.current.dispose) {
        modelRef.current.dispose();
        modelRef.current = null;
      }
    };
  }, [stopWebcam]);

  const highestPrediction = predictions.reduce(
    (prev, current) => (prev.probability > current.probability ? prev : current),
    { className: "...", probability: 0 }
  );
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    setSuggestedGestures(null);
    try {
      const result = await suggestSignLanguageGestures({
        existingGestures,
        desiredCapabilities: values.desiredCapabilities,
      });
      setSuggestedGestures(result.suggestedGestures);
       toast({
        title: "Suggestions Received!",
        description: "AI has suggested new gestures to add.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "An error occurred.",
        description: "Failed to get suggestions from AI.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="flex flex-col gap-8 lg:col-span-2">
        <Card className="overflow-hidden shadow-lg">
          <CardHeader className="bg-muted/30 flex-row items-center justify-between">
             <div className="space-y-1.5">
                <CardTitle className="flex items-center gap-2">
                    <Webcam className="text-primary" />
                    Live Feed
                </CardTitle>
                <CardDescription>
                    The model is analyzing your hand gestures in real-time.
                </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleToggleWebcam} disabled={loading}>
              {isWebcamActive ? <VideoOff /> : <Video />}
              <span>{isWebcamActive ? "Stop Webcam" : "Start Webcam"}</span>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
             <div className="relative aspect-square max-w-full overflow-hidden mx-auto bg-black flex items-center justify-center">
                 {(loading || !isWebcamActive) && (
                    <div className="absolute z-10 text-center text-white/80 p-4">
                        <Hand className="mx-auto h-12 w-12 mb-4" />
                        <p className="font-medium">{status}</p>
                        {!isWebcamActive && !loading && <p className="text-sm">Click "Start Webcam" to begin.</p>}
                    </div>
                )}
                <div ref={canvasContainerRef} className="h-full w-full flex items-center justify-center [&>canvas]:h-full [&>canvas]:w-full [&>canvas]:object-contain" />
                {isWebcamActive && predictions.length > 0 && (
                    <div className="absolute bottom-4 left-4 flex items-center gap-4 rounded-lg bg-background/80 p-4 shadow-md backdrop-blur-sm">
                        <Type className="h-10 w-10 text-primary" />
                        <div>
                        <p className="text-sm text-muted-foreground">Recognized Text</p>
                        <p className="text-2xl font-bold font-headline text-foreground">
                            {highestPrediction.className}
                        </p>
                        </div>
                    </div>
                )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Gesture Probabilities</CardTitle>
            <CardDescription>
              Confidence scores for each detected sign class.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             {!isWebcamActive ? (
                 <div className="text-center text-muted-foreground py-8">
                    <p>Start the webcam to see predictions.</p>
                 </div>
             ) : loading ? (
                 <div className="text-center text-muted-foreground py-8">
                    <p>Waiting for model to load...</p>
                 </div>
             ) : predictions.length > 0 ? (
              predictions
                .sort((a, b) => b.probability - a.probability)
                .map((p) => (
                <div key={p.className}>
                  <div className="mb-1 flex justify-between">
                    <span className="font-medium">{p.className}</span>
                    <span className="text-muted-foreground">
                      {(p.probability * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={p.probability * 100} />
                </div>
              ))
            ) : (
                <div className="text-center text-muted-foreground py-8">
                    <p>No gestures detected yet.</p>
                </div>
            )}
          </CardContent>
        </Card>

      </div>

      <div className="lg:col-span-1">
        <Card className="sticky top-20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="text-accent" />
              Suggest New Gestures
            </CardTitle>
            <CardDescription>
              Use GenAI to suggest new gestures to expand the model's capabilities based on your needs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Label className="font-medium">Current Model Gestures</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {existingGestures.length > 0 ? existingGestures.map(g => <Badge key={g} variant="secondary">{g}</Badge>) : <p className="text-sm text-muted-foreground">Start webcam to load gestures.</p>}
              </div>
            </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="desiredCapabilities"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Desired Capabilities</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={`e.g., "I want to add gestures for common questions like 'who', 'what', 'where'."`}
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Describe the new signs you want the model to learn.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isSubmitting || existingGestures.length === 0}>
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Get Suggestions
                </Button>
              </form>
            </Form>
          </CardContent>
          {suggestedGestures && (
            <CardFooter className="flex flex-col items-start gap-4 border-t pt-6">
              <CardTitle className="text-lg">AI Suggestions</CardTitle>
              <div className="flex flex-wrap gap-2">
                {suggestedGestures.map((gesture) => (
                    <Badge key={gesture} variant="default" className="bg-accent text-accent-foreground text-sm py-1 px-3">
                        {gesture}
                    </Badge>
                ))}
              </div>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
