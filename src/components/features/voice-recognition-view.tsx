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
import React, { useEffect, useState, useRef } from "react";
import { Progress } from "../ui/progress";

// Extend window to include speechCommands and tf
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

// URL to your Teachable Machine model
const URL = "https://teachablemachine.withgoogle.com/models/n1zk7_NFn/";

export default function VoiceRecognitionView() {
  const { toast } = useToast();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Ready to start");
  const [isListening, setIsListening] = useState(false);
  const isListeningRef = useRef(isListening);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  const handleToggleListening = () => {
    setIsListening((prev) => !prev);
  };

  useEffect(() => {
    if (!isListening) {
      return;
    }

    let recognizer: any;

    const init = async () => {
      if (
        typeof window.speechCommands === "undefined" ||
        typeof window.tf === "undefined"
      ) {
        setStatus("Waiting for libraries to load...");
        setTimeout(init, 500);
        return;
      }

      try {
        setLoading(true);
        setStatus("Initializing...");

        const modelURL = URL + "model.json";
        const metadataURL = URL + "metadata.json";

        setStatus("Loading model...");
        recognizer = window.speechCommands.create(
          "BROWSER_FFT",
          undefined,
          modelURL,
          metadataURL
        );
        await recognizer.ensureModelLoaded();
        
        const classLabels = recognizer.wordLabels();

        setLoading(false);
        setStatus("Listening...");
        
        recognizer.listen(
          (result: { scores: Float32Array }) => {
            if (!isListeningRef.current) return;
            const scores = Array.from(result.scores);
            const newPredictions = classLabels.map(
              (label: string, index: number) => ({
                className: label,
                probability: scores[index],
              })
            );
            setPredictions(newPredictions);
          },
          {
            includeSpectrogram: true,
            probabilityThreshold: 0.75,
            invokeCallbackOnNoiseAndUnknown: true,
            overlapFactor: 0.75,
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
        setIsListening(false);
      }
    };

    init();

    return () => {
      if (recognizer) {
        if (recognizer.isListening()) {
          recognizer.stopListening();
        }
        // In some versions of the library, recognizer might not have a `delete` or `dispose` method
        // for the model itself, as it's managed internally.
        // We rely on TF.js garbage collection here.
      }
      if (window.tf && window.tf.disposeVariables) {
        window.tf.disposeVariables();
      }
      setLoading(false);
      setStatus("Microphone off");
      setPredictions([]);
    };
  }, [isListening, toast]);

  const highestPrediction = predictions.reduce(
    (prev, current) =>
      prev.probability > current.probability ? prev : current,
    { className: "...", probability: 0 }
  );
  
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
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleListening}
              disabled={loading}
            >
              {isListening ? <MicOff /> : <Mic />}
              <span>{isListening ? "Stop Listening" : "Start Listening"}</span>
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center gap-8 pt-10">
            <div className="relative flex h-48 w-48 items-center justify-center">
              {isListening && !loading && (
                <div className="absolute h-full w-full animate-pulse rounded-full bg-primary/20"></div>
              )}
              <div
                className={`flex h-36 w-36 items-center justify-center rounded-full bg-primary/10 transition-colors`}
              >
                {loading ? (
                   <Loader2 className="h-16 w-16 text-primary animate-spin" />
                ) : isListening && predictions.length > 0 ? (
                    highestPrediction.className === "Singing" ? (
                    <Music className="h-16 w-16 text-primary" />
                    ) : (
                    <User className="h-16 w-16 text-primary" />
                    )
                ) : (
                  <User className="h-16 w-16 text-primary" />
                )}
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Detection Result</p>
              <p className="text-3xl font-bold font-headline text-foreground capitalize">
                {isListening && !loading && predictions.length > 0 ? highestPrediction.className : "..."}
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
                    <span className="font-medium capitalize">
                      {p.className === "_background_noise_"
                        ? "Background Noise"
                        : p.className}
                    </span>
                    <span className="text-muted-foreground">
                      {(p.probability * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={p.probability * 100} />
                </div>
              ))
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <p>Listening...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
