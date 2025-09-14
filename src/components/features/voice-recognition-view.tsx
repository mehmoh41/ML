"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mic, MicOff, Loader2, Music, User } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Progress } from "../ui/progress";

// Extend the window object to include speechCommands
declare global {
  interface Window {
    speechCommands: any;
    tf: any;
  }
}

const URL = "https://teachablemachine.withgoogle.com/models/n1zk7_NFn/";

type Prediction = {
  className: string;
  probability: number;
};

export default function VoiceRecognitionView() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Ready to start");
  const [isListening, setIsListening] = useState(false);

  const recognizerRef = useRef<any | null>(null);

  const modelURL = URL + "model.json";
  const metadataURL = URL + "metadata.json";

  const stopListening = useCallback(() => {
    if (recognizerRef.current && recognizerRef.current.isListening()) {
      recognizerRef.current.stopListening();
    }
    setIsListening(false);
    setStatus("Microphone off");
    setPredictions([]);
  }, []);

  const startListening = useCallback(async () => {
    if (typeof window.speechCommands === 'undefined' || typeof window.tf === 'undefined') {
      setStatus("Waiting for libraries to load...");
      setTimeout(startListening, 500);
      return;
    }

    try {
      setLoading(true);
      setIsListening(true);
      setStatus("Initializing...");

      if (!recognizerRef.current) {
        setStatus("Loading model...");
        const recognizer = window.speechCommands.create(
          "BROWSER_FFT",
          undefined,
          modelURL,
          metadataURL
        );
        await recognizer.ensureModelLoaded();
        recognizerRef.current = recognizer;
      }
      
      const recognizer = recognizerRef.current;
      const classLabels = recognizer.wordLabels();

      setLoading(false);
      setStatus("Listening...");

      recognizer.listen(
        (result: { scores: Float32Array }) => {
          const scores = Array.from(result.scores);
          const newPredictions = classLabels.map((label: string, index: number) => ({
            className: label,
            probability: scores[index],
          }));
          setPredictions(newPredictions);
        },
        {
          includeSpectrogram: true,
          probabilityThreshold: 0.75,
          invokeCallbackOnNoiseAndUnknown: true,
          overlapFactor: 0.5,
        }
      );

    } catch (error) {
      console.error("Error initializing Teachable Machine:", error);
      setStatus("Error loading model. Please check permissions and refresh.");
      setIsListening(false);
      setLoading(false);
    }
  }, [metadataURL, modelURL]);

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  const highestPrediction = predictions.reduce(
    (prev, current) => (prev.probability > current.probability ? prev : current),
    { className: "...", probability: 0 }
  );
  
  const isSinging = ['songs', 'qawali'].includes(highestPrediction.className) && highestPrediction.probability > 0.8;

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
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
            <p className="text-3xl font-bold font-headline text-foreground">
              {isListening ? highestPrediction.className : '...'}
            </p>
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-lg">
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
                    <span className="font-medium capitalize">{p.className}</span>
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
