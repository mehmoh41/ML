"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Webcam } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import * as tmPose from "@teachablemachine/pose";
import * as tf from "@tensorflow/tfjs";
import { Progress } from "../ui/progress";

// URL to your Teachable Machine model
const URL = "/my_model/";

type Prediction = {
  className: string;
  probability: number;
};

export default function EmotionDetectionView() {
  const { toast } = useToast();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("Loading model...");

  const webcamRef = useRef<tmPose.Webcam | null>(null);
  const modelRef = useRef<tmPose.CustomPoseNet | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const webcamContainerRef = useRef<HTMLDivElement>(null);
  const animationFrameId = useRef<number | null>(null);

  const modelURL = URL + "model.json";
  const metadataURL = URL + "metadata.json";

  const predict = useCallback(async (webcam: tmPose.Webcam) => {
    const model = modelRef.current;
    if (model && webcam.canvas) {
      const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
      const prediction = await model.predict(posenetOutput);
      setPredictions(prediction);

      const canvas = canvasRef.current;
      if (canvas && pose) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(webcam.canvas, 0, 0);
          tmPose.drawKeypoints(pose.keypoints, 0.6, ctx);
          tmPose.drawSkeleton(pose.keypoints, 0.6, ctx);
        }
      }
    }
  }, []);

  const loop = useCallback(async () => {
    const webcam = webcamRef.current;
    if (webcam) {
      webcam.update();
      await predict(webcam);
      animationFrameId.current = requestAnimationFrame(loop);
    }
  }, [predict]);

  const init = useCallback(async () => {
    try {
      setStatus("Loading model...");
      await tf.ready();
      const loadedModel = await tmPose.load(modelURL, metadataURL);
      modelRef.current = loadedModel;

      setStatus("Initializing webcam...");
      const size = 400;
      const flip = true;
      const newWebcam = new tmPose.Webcam(size, size, flip);
      await newWebcam.setup();
      await newWebcam.play();
      webcamRef.current = newWebcam;

      if (webcamContainerRef.current) {
        webcamContainerRef.current.replaceChildren(newWebcam.canvas);
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
        description: "Could not load model or access webcam. Please make sure your model files are in the public/my_model folder.",
      });
    }
  }, [loop, metadataURL, modelURL, toast]);
  
  useEffect(() => {
    init();

    return () => {
      // Cleanup function to stop webcam and animation loop
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      const webcam = webcamRef.current;
      if (webcam) {
        webcam.stop();
      }
    };
  }, [init]);

  const highestPrediction = predictions.reduce(
    (prev, current) => (prev.probability > current.probability ? prev : current),
    { className: "...", probability: 0 }
  );

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="flex flex-col gap-8 lg:col-span-2">
        <Card className="overflow-hidden shadow-lg">
          <CardHeader className="bg-muted/30">
            <CardTitle className="flex items-center gap-2">
              <Webcam className="text-primary" />
              Live Pose Detection
            </CardTitle>
            <CardDescription>
              The model is analyzing your pose in real-time using your Teachable Machine model.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative aspect-square max-w-full overflow-hidden mx-auto bg-black flex items-center justify-center">
              {loading && (
                 <div className="absolute z-10 text-center text-white">
                    <p>{status}</p>
                 </div>
              )}
               <div ref={webcamContainerRef} className="absolute inset-0" style={{ display: loading ? 'none' : 'block' }}></div>
              <canvas ref={canvasRef} width={400} height={400} className="h-full w-full object-contain" />
              
              <div className="absolute bottom-4 right-4 flex items-center gap-4 rounded-lg bg-background/80 p-4 shadow-md backdrop-blur-sm">
                <div>
                  <p className="text-sm text-muted-foreground">Detected Pose</p>
                  <p className="text-2xl font-bold font-headline text-foreground">
                    {highestPrediction.className}
                  </p>
                </div>
              </div>
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
             {loading ? (
                 <div className="text-center text-muted-foreground">
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
                <div className="text-center text-muted-foreground">
                    <p>No poses detected yet.</p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
