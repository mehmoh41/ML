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
import React, { useEffect, useRef, useState } from "react";
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

  const webcamContainerRef = useRef<HTMLDivElement>(null);
  const animationFrameId = useRef<number | null>(null);

  const handleToggleWebcam = () => {
    setIsWebcamActive((prev) => !prev);
  };

  useEffect(() => {
    if (!isWebcamActive) {
      return;
    }

    let model: any;
    let webcam: any;

    const init = async () => {
      if (
        typeof window.tmImage === "undefined" ||
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
        model = await window.tmImage.load(modelURL, metadataURL);
        
        setStatus("Setting up webcam...");
        const flip = true; // whether to flip the webcam
        webcam = new window.tmImage.Webcam(200, 200, flip); // width, height, flip
        await webcam.setup(); // request access to the webcam
        await webcam.play();
        
        if (webcamContainerRef.current) {
          webcamContainerRef.current.innerHTML = "";
          webcamContainerRef.current.appendChild(webcam.canvas);
        }

        setLoading(false);
        setStatus("Ready");

        const loop = async () => {
          if (!webcam) return;
          webcam.update(); // update the webcam frame
          const prediction = await model.predict(webcam.canvas);
          setPredictions(prediction);
          animationFrameId.current = requestAnimationFrame(loop);
        };

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
    };
    
    init();

    return () => {
      // This is the cleanup function.
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      
      if (webcam) {
        webcam.stop();
        if (webcamContainerRef.current && webcamContainerRef.current.contains(webcam.canvas)) {
          webcamContainerRef.current.removeChild(webcam.canvas);
        }
      }
      
      if (model) {
        model.dispose();
      }

      if (window.tf && window.tf.disposeVariables) {
        window.tf.disposeVariables();
      }
      
      setStatus("Ready to start");
      setPredictions([]);
      setLoading(false);
    }
  }, [isWebcamActive, toast]);

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