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
import WebcamView from "../shared/webcam-view";

// Extend window to include tmImage
declare global {
  interface Window {
    tmImage: any;
    tf: any;
  }
}

const URL = "https://teachablemachine.withgoogle.com/models/p2LLADs3g/";

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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animationFrameId = useRef<number | null>(null);

  const predict = useCallback(async () => {
    if (!modelRef.current || !videoRef.current) {
      return;
    }
    try {
      const prediction = await modelRef.current.predict(videoRef.current);
      setPredictions(prediction);
    } catch (error) {
      console.error("Prediction error:", error);
    }
  }, []);

  const loop = useCallback(async () => {
    if (!modelRef.current) return;
    await predict();
    animationFrameId.current = requestAnimationFrame(loop);
  }, [predict]);

  const onStream = useCallback(
    (stream: MediaStream) => {
      const video = document.querySelector(
        '[data-ai-id="webcam-video-feed"]'
      ) as HTMLVideoElement;
      if (!video) return;

      video.srcObject = stream;
      videoRef.current = video;

      if (typeof window.tmImage === "undefined" || typeof window.tf === "undefined") {
        setStatus("Waiting for libraries to load...");
        return;
      }

      if (modelRef.current) return; // Don't load model if it's already loaded

      setLoading(true);
      setStatus("Initializing...");

      const modelURL = URL + "model.json";
      const metadataURL = URL + "metadata.json";

      setStatus("Loading model...");
      window.tmImage
        .load(modelURL, metadataURL)
        .then((loadedModel: any) => {
          modelRef.current = loadedModel;
          setLoading(false);
          setStatus("Ready");
          animationFrameId.current = requestAnimationFrame(loop);
        })
        .catch((error: any) => {
          console.error("Error initializing Teachable Machine:", error);
          setStatus("Error loading model. Please check permissions and refresh.");
          toast({
            variant: "destructive",
            title: "Initialization Failed",
            description: "Could not load model or access webcam.",
          });
          setLoading(false);
          setIsWebcamActive(false);
        });
    },
    [loop, toast]
  );

    const stopWebcam = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    
    if (modelRef.current) {
      if (typeof modelRef.current.dispose === "function") {
        modelRef.current.dispose();
      }
      modelRef.current = null;
    }
    
    if (window.tf && window.tf.disposeVariables) {
      window.tf.disposeVariables();
    }
    
    videoRef.current = null;
    setPredictions([]);
    setLoading(false);
    setStatus("Ready to start");
  }, []);


  useEffect(() => {
    // This is the cleanup function that runs when the component unmounts.
    return () => {
      if(isWebcamActive) {
        setIsWebcamActive(false);
      }
      stopWebcam();
    };
  }, [isWebcamActive, stopWebcam]);
  
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
            <div className="relative aspect-square max-w-full overflow-hidden mx-auto bg-black flex items-center justify-center">
              <WebcamView enabled={isWebcamActive} onStream={onStream} onStop={stopWebcam} />
              {loading && isWebcamActive && (
                <div className="absolute z-10 text-center text-white/80 p-4">
                  <Hand className="mx-auto h-12 w-12 mb-4" />
                  <p className="font-medium">{status}</p>
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
                        {(p.probability * 100).toFixed(0)}%
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
