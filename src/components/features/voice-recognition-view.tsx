"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Mic, MicOff, Loader2, Music, User } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Progress } from "../ui/progress";

declare global {
  interface Window {
    speechCommands: any;
    tf: any;
  }
}

type Prediction = {
  className: string;
  probability: number;
};

export default function VoiceRecognitionView() {
  const { toast } = useToast();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Ready to start");
  const [isListening, setIsListening] = useState(false);

  const recognizerRef = useRef<any | null>(null);

  const stopListening = useCallback(() => {
    if (recognizerRef.current) {
      if (recognizerRef.current.isListening()) {
        recognizerRef.current.stopListening();
      }
      // The delete function can throw an error if the model is already gone.
      // We can safely ignore it.
      try {
        if (typeof recognizerRef.current.delete === 'function') {
          recognizerRef.current.delete();
        }
      } catch (error) {
         console.warn("Could not delete recognizer, it might have been cleaned up already.", error);
      }
      recognizerRef.current = null;
    }
     // Clean up global tf memory
    if (window.tf && window.tf.disposeVariables) {
      window.tf.disposeVariables();
    }
    setLoading(false);
    setIsListening(false);
    setStatus("Microphone off");
    setPredictions([]);
  }, []);


  const startListening = useCallback(async () => {
    if (typeof window.speechCommands === 'undefined' || typeof window.tf === 'undefined') {
      setStatus("Waiting for libraries to load...");
      setTimeout(() => startListening(), 500);
      return;
    }

    try {
      setLoading(true);
      setStatus("Initializing...");

      // Ensure any old recognizer is stopped before creating a new one.
      if (recognizerRef.current) {
        stopListening();
      }

      setStatus("Loading model...");
      const URL = window.location.origin + "/my_model/";
      const modelURL = URL + "model.json";
      const metadataURL = URL + "metadata.json";

      const newRecognizer = window.speechCommands.create(
        "BROWSER_FFT",
        undefined,
        modelURL,
        metadataURL
      );
      await newRecognizer.ensureModelLoaded();
      recognizerRef.current = newRecognizer;
      
      const recognizer = recognizerRef.current;
      const classLabels = recognizer.wordLabels();

      setLoading(false);
      setStatus("Listening...");
      setIsListening(true);

      recognizer.listen(
        (result: { scores: Float32Array }) => {
          // Check if recognizer is still active before updating state
          if (recognizerRef.current) {
            const scores = Array.from(result.scores);
            const newPredictions = classLabels.map((label: string, index: number) => ({
              className: label,
              probability: scores[index],
            }));
            setPredictions(newPredictions);
          }
        },
        {
          includeSpectrogram: true,
          probabilityThreshold: 0.75,
          invokeCallbackOnNoiseAndUnknown: true,
          overlapFactor: 0.50, //
        }
      );

    } catch (error) {
      console.error("Error initializing audio recognition:", error);
      setStatus("Error loading model. Please check permissions and refresh.");
      toast({
        variant: "destructive",
        title: "Initialization Failed",
        description: "Could not load model or access microphone.",
      });
      stopListening();
    }
  }, [stopListening, toast]);
  
  // This is the cleanup function that runs when the component unmounts.
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  const handleToggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const highestPrediction = predictions.reduce(
    (prev, current) => (prev.probability > current.probability ? prev : current),
    { className: "...", probability: 0 }
  );
  
  const isSinging = ['songs', 'qawali'].includes(highestPrediction.className) && highestPrediction.probability > 0.8;

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
      <div className="md:col-span-2">
        <Card className="shadow-lg">
          <CardHeader className="bg-muted/30 flex-row items-center justify-between">
            <div className="space-y-1.5">
              <CardTitle className="flex items-center gap-2">
                <Mic className="text-primary" />
                Live Audio Recognition
              </CardTitle>
              <CardDescription>
                The model is analyzing audio from your microphone.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleToggleListening} disabled={loading}>
              {isListening ? <MicOff /> : <Mic />}
              <span>{isListening ? "Stop Listening" : "Start Listening"}</span>
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center gap-8 pt-10">
            <div className="relative flex h-48 w-48 items-center justify-center">
              {isListening && <div className="absolute h-full w-full animate-pulse rounded-full bg-primary/20"></div>}
              <div className={`flex h-36 w-36 items-center justify-center rounded-full bg-primary/10 transition-colors`}>
                {isSinging ? (
                  <Music className="h-16 w-16 text-primary" />
                ) : (
                  <User className="h-16 w-16 text-primary" />
                )}
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Detection Result</p>
              <p className="text-3xl font-bold font-headline text-foreground capitalize">
                {isListening ? highestPrediction.className : '...'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg md:col-span-1 sticky top-20">
        <CardHeader>
          <CardTitle>Class Probabilities</CardTitle>
          <CardDescription>
            Confidence scores for each detected audio class.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isListening ? (
            <div className="text-center text-muted-foreground py-8">
              <p>{status}</p>
              {!loading && <p>Start listening to see predictions.</p>}
            </div>
          ) : loading ? (
            <div className="text-center text-muted-foreground py-8 flex items-center justify-center gap-2">
              <Loader2 className="animate-spin" />
              <p>Loading model...</p>
            </div>
          ) : predictions.length > 0 ? (
            predictions
              .sort((a, b) => b.probability - a.probability)
              .map((p) => (
                <div key={p.className}>
                  <div className="mb-1 flex justify-between">
                    <span className="font-medium capitalize">{p.className === '_background_noise_' ? 'Background Noise' : p.className}</span>
                    <span className="text-muted-foreground">
                      {(p.probability * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={p.probability * 100} />
                </div>
              ))
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <p>No audio detected yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
