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
import { Hand, Type, Webcam, Video, VideoOff } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Progress } from "../ui/progress";

// Extend window to include tmImage
declare global {
  interface Window {
    tmImage: any;
    tf: any;
  }
}

const URL = "https://teachablemachine.withgoogle.com/models/qvTj5wIKh/";

type Prediction = {
  className: string;
  probability: number;
};

export default function SignLanguageView() {
  const { toast } = useToast();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Ready to start");
  const [isWebcamActive, setIsWebcamActive] = useState(false);

  const modelRef = useRef<any | null>(null);
  const webcamRef = useRef<any | null>(null);
  const webcamContainerRef = useRef<HTMLDivElement>(null);
  const animationFrameId = useRef<number | null>(null);

  const stopWebcam = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }

    if (webcamRef.current) {
      if (typeof webcamRef.current.stop === "function") {
        webcamRef.current.stop();
      }
      if (
        webcamContainerRef.current &&
        webcamRef.current.canvas &&
        webcamContainerRef.current.contains(webcamRef.current.canvas)
      ) {
        webcamContainerRef.current.removeChild(webcamRef.current.canvas);
      }
      webcamRef.current = null;
    }

    if (modelRef.current) {
      if (typeof modelRef.current.dispose === "function") {
        modelRef.current.dispose();
      }
      modelRef.current = null;
    }

    if (window.tf && typeof window.tf.disposeVariables === "function") {
      window.tf.disposeVariables();
    }

    setStatus("Webcam stopped.");
    setPredictions([]);
    setLoading(false);
  }, []);

  const predict = useCallback(async () => {
    if (!modelRef.current || !webcamRef.current?.canvas) {
      return;
    }
    try {
      // predict can take in an image, video or canvas html element
      const prediction = await modelRef.current.predict(
        webcamRef.current.canvas
      );
      setPredictions(prediction);
    } catch (error) {
      console.error("Prediction error:", error);
    }
  }, []);

  const loop = useCallback(async () => {
    if (webcamRef.current) {
      webcamRef.current.update(); // update the webcam frame
      await predict();
    }
    animationFrameId.current = requestAnimationFrame(loop);
  }, [predict]);

  const startWebcam = useCallback(async () => {
    if (
      typeof window.tmImage === "undefined" ||
      typeof window.tf === "undefined"
    ) {
      setStatus("Waiting for libraries to load...");
      setTimeout(startWebcam, 500);
      return;
    }
    try {
      setLoading(true);
      setStatus("Initializing...");

      const modelURL = URL + "model.json";
      const metadataURL = URL + "metadata.json";

      setStatus("Loading model...");
      const loadedModel = await window.tmImage.load(modelURL, metadataURL);
      modelRef.current = loadedModel;

      setStatus("Setting up webcam...");
      const flip = true; // whether to flip the webcam
      const newWebcam = new window.tmImage.Webcam(200, 200, flip); // width, height, flip
      await newWebcam.setup(); // request access to the webcam
      await newWebcam.play();
      webcamRef.current = newWebcam;

      if (webcamContainerRef.current) {
        webcamContainerRef.current.innerHTML = "";
        webcamContainerRef.current.appendChild(newWebcam.canvas);
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
      stopWebcam();
      setIsWebcamActive(false);
    }
  }, [toast, loop, stopWebcam]);

  useEffect(() => {
    if (isWebcamActive) {
      startWebcam();
    } else {
      stopWebcam();
    }
    
    return () => {
      stopWebcam();
    };
  }, [isWebcamActive, startWebcam, stopWebcam]);

  const handleToggleWebcam = () => {
    setIsWebcamActive((prev) => !prev);
  };

  const highestPrediction = predictions.reduce(
    (prev, current) =>
      prev.probability > current.probability ? prev : current,
    { className: "...", probability: 0 }
  );

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
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleWebcam}
              disabled={loading && isWebcamActive}
            >
              {isWebcamActive ? <VideoOff /> : <Video />}
              <span>{isWebcamActive ? "Stop Webcam" : "Start Webcam"}</span>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div
              ref={webcamContainerRef}
              id="webcam-container"
              className="relative aspect-square max-w-full overflow-hidden mx-auto bg-black flex items-center justify-center"
            >
              {!isWebcamActive && (
                <div className="absolute z-10 text-center text-white/80 p-4">
                  <Hand className="mx-auto h-12 w-12 mb-4" />
                  <p className="font-medium">{status}</p>
                   {!isWebcamActive && !loading && (
                    <p className="text-sm">Click "Start Webcam" to begin.</p>
                  )}
                </div>
              )}
              {isWebcamActive && predictions.length > 0 && !loading && (
                <div className="absolute bottom-4 left-4 flex items-center gap-4 rounded-lg bg-background/80 p-4 shadow-md backdrop-blur-sm">
                  <Type className="h-10 w-10 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Recognized Text
                    </p>
                    <p className="text-2xl font-bold font-headline text-foreground">
                      {highestPrediction.className}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1">
        <Card className="sticky top-20 shadow-lg">
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
                <p>{status}</p>
              </div>
            ) : predictions.length > 0 ? (
              predictions
                .sort((a, b) => b.probability - a.probability)
                .map((p) => (
                  <div key={p.className}>
                    <div className="mb-1 flex justify-between">
                      <span className="font-medium">{p.className}</span>
                      <span className="text-muted-foreground">
                        {(p.probability * 100).toFixed(2)}%
                      </span>
                    </div>
                    <Progress value={p.probability * 100} />
                  </div>
                ))
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <p>No gestures detected yet. Point your hand at the camera.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
