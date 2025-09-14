"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Webcam, Video, VideoOff } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Progress } from "../ui/progress";
import { Button } from "../ui/button";

// Extend the window object to include tmPose
declare global {
  interface Window {
    tmPose: any;
    tf: any;
  }
}

// URL to your Teachable Machine model
const URL = "https://teachablemachine.withgoogle.com/models/dLoNiKL7F/";

type Prediction = {
  className: string;
  probability: number;
};

export default function EmotionDetectionView() {
  const { toast } = useToast();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Ready to start");
  const [isWebcamActive, setIsWebcamActive] = useState(false);

  const webcamRef = useRef<any | null>(null);
  const modelRef = useRef<any | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);

  const stopWebcam = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }

    if (webcamRef.current) {
      webcamRef.current.stop();
       const stream = webcamRef.current.canvas?.srcObject;
      if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach((track: MediaStreamTrack) => track.stop());
      }
      webcamRef.current = null;
    }

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
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

    setStatus("Webcam stopped.");
    setPredictions([]);
    setLoading(false);
  }, []);

  const predict = useCallback(async () => {
    if (!modelRef.current || !webcamRef.current?.canvas) {
      return;
    }
    try {
      const { pose, posenetOutput } = await modelRef.current.estimatePose(
        webcamRef.current.canvas
      );
      if (!modelRef.current) return;
      const prediction = await modelRef.current.predict(posenetOutput);
      setPredictions(prediction);

      const canvas = canvasRef.current;
      if (canvas && pose) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(webcamRef.current.canvas, 0, 0);
          if (pose && window.tmPose) {
            window.tmPose.drawKeypoints(pose.keypoints, 0.6, ctx);
            window.tmPose.drawSkeleton(pose.keypoints, 0.6, ctx);
          }
        }
      }
    } catch (error) {
      console.error("Prediction error:", error);
    }
  }, []);

  const loop = useCallback(async () => {
    if (webcamRef.current) {
      webcamRef.current.update();
      await predict();
    }
    animationFrameId.current = requestAnimationFrame(loop);
  }, [predict]);

  const startWebcam = useCallback(async () => {
    if (
      typeof window.tmPose === "undefined" ||
      typeof window.tf === "undefined"
    ) {
      setStatus("Waiting for libraries to load...");
      setTimeout(() => startWebcam(), 500);
      return;
    }

    try {
      setLoading(true);
      setStatus("Initializing TensorFlow...");
      await window.tf.ready();

      setStatus("Loading model...");
      const modelURL = URL + "model.json";
      const metadataURL = URL + "metadata.json";
      modelRef.current = await window.tmPose.load(modelURL, metadataURL);

      setStatus("Initializing webcam...");
      const size = 400;
      const flip = true;
      const newWebcam = new window.tmPose.Webcam(size, size, flip);
      await newWebcam.setup();
      await newWebcam.play();
      webcamRef.current = newWebcam;

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
      stopWebcam();
    }
  }, [toast, stopWebcam, loop]);

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

  const handleToggleWebcam = useCallback(() => {
    setIsWebcamActive((prev) => !prev);
  }, []);

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
                Live Pose Detection
              </CardTitle>
              <CardDescription>
                The model is analyzing your pose in real-time.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleWebcam}
              disabled={loading}
            >
              {isWebcamActive ? <VideoOff /> : <Video />}
              <span>{isWebcamActive ? "Stop Webcam" : "Start Webcam"}</span>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative aspect-square max-w-full overflow-hidden mx-auto bg-black flex items-center justify-center">
              {!isWebcamActive && (
                <div className="absolute z-10 text-center text-white/80 p-4">
                  <Webcam className="mx-auto h-12 w-12 mb-4" />
                  <p className="font-medium">{status}</p>
                  {!isWebcamActive && !loading && (
                    <p className="text-sm">Click "Start Webcam" to begin.</p>
                  )}
                </div>
              )}
              <canvas
                ref={canvasRef}
                width={400}
                height={400}
                className={`h-full w-full object-contain ${
                  isWebcamActive ? "" : "hidden"
                }`}
              />

              {isWebcamActive && predictions.length > 0 && (
                <div className="absolute bottom-4 right-4 flex items-center gap-4 rounded-lg bg-background/80 p-4 shadow-md backdrop-blur-sm">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Detected Pose
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
            <CardTitle>Pose Probabilities</CardTitle>
            <CardDescription>
              Confidence scores for each detected pose class.
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
                <p>No poses detected yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
