"use client";

import { analyzeAudio } from "@/ai/flows/analyze-audio-for-voice-model";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mic, Music, Sparkles, Square } from "lucide-react";
import React, { useRef, useState } from "react";
import { Progress } from "../ui/progress";

type RecordingState = "idle" | "recording" | "stopped" | "analyzing";
type DetectionResult = "..." | "Singing" | "Not Singing";

export default function VoiceRecognitionView() {
  const { toast } = useToast();
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [detectionResult, setDetectionResult] = useState<DetectionResult>("...");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [aiResult, setAiResult] = useState<{
    musicPresence: boolean;
    noiseLevel: string;
    speechClarity: string;
    overallQuality: string;
  } | null>(null);

  const startRecording = async () => {
    setRecordingState("recording");
    setDetectionResult("...");
    setAiResult(null);
    setAudioBlob(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setRecordingState("stopped");
        // Simulate local detection
        setDetectionResult(Math.random() > 0.5 ? "Singing" : "Not Singing");
        // Stop all media tracks to turn off mic icon in browser tab
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast({
        variant: "destructive",
        title: "Microphone Access Denied",
        description: "Please allow microphone access in your browser settings.",
      });
      setRecordingState("idle");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const handleAnalyzeAudio = async () => {
    if (!audioBlob) return;

    setRecordingState("analyzing");
    setAiResult(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        const result = await analyzeAudio({ audioDataUri: base64Audio });
        setAiResult(result);
        setRecordingState("stopped");
      };
    } catch (error) {
      toast({
        variant: "destructive",
        title: "An error occurred.",
        description: "Failed to analyze audio.",
      });
      setRecordingState("stopped");
    }
  };

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="text-primary" />
            Voice Recorder
          </CardTitle>
          <CardDescription>
            Record your voice and our model will determine if you're singing.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center gap-8 pt-10">
          <div className="relative flex h-48 w-48 items-center justify-center">
            {recordingState === "recording" && (
              <div className="absolute h-full w-full animate-pulse rounded-full bg-primary/20"></div>
            )}
            <div
              className={`flex h-36 w-36 items-center justify-center rounded-full bg-primary/10 transition-colors ${
                recordingState === "recording" ? "bg-primary/20" : ""
              }`}
            >
              {detectionResult === "Singing" ? (
                <Music className="h-16 w-16 text-primary" />
              ) : (
                <Mic className="h-16 w-16 text-primary" />
              )}
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">Detection Result</p>
            <p className="text-3xl font-bold font-headline text-foreground">
              {detectionResult}
            </p>
          </div>

          {recordingState === "idle" && (
            <Button size="lg" onClick={startRecording}>
              <Mic className="mr-2 h-4 w-4" /> Start Recording
            </Button>
          )}

          {recordingState === "recording" && (
            <Button size="lg" variant="destructive" onClick={stopRecording}>
              <Square className="mr-2 h-4 w-4" /> Stop Recording
            </Button>
          )}

          {["stopped", "analyzing"].includes(recordingState) && audioBlob && (
            <div className="flex gap-4">
              <Button size="lg" onClick={startRecording}>
                <Mic className="mr-2 h-4 w-4" /> Record Again
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleAnalyzeAudio}
                disabled={recordingState === "analyzing"}
              >
                {recordingState === "analyzing" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Analyze Audio
              </Button>
            </div>
          )}
        </CardContent>
        {audioBlob && (
          <CardFooter>
            <audio controls src={URL.createObjectURL(audioBlob)} className="w-full" />
          </CardFooter>
        )}
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="text-accent" />
            AI Audio Analysis
          </CardTitle>
          <CardDescription>
            Get a detailed quality analysis of your recorded audio using GenAI.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex h-[400px] flex-col items-center justify-center text-center">
          {recordingState === "analyzing" && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-lg font-medium">Analyzing audio...</p>
              <p className="text-muted-foreground">This may take a moment.</p>
            </div>
          )}
          {!aiResult && recordingState !== "analyzing" && (
             <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
                <Sparkles className="h-12 w-12"/>
                <p>Record and then click "Analyze Audio"</p>
                <p className="text-sm">to see the AI analysis here.</p>
            </div>
          )}
          {aiResult && (
            <div className="w-full space-y-6 text-left">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overall Quality</p>
                <p className="text-2xl font-bold capitalize text-primary font-headline">{aiResult.overallQuality}</p>
              </div>
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                  <span className="font-medium">Music Present</span>
                  <span className={`font-semibold ${aiResult.musicPresence ? 'text-primary' : 'text-muted-foreground'}`}>
                    {aiResult.musicPresence ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Noise Level</span>
                  <span className="font-semibold capitalize">{aiResult.noiseLevel}</span>
                </div>
                 <div className="flex items-center justify-between">
                  <span className="font-medium">Speech Clarity</span>
                  <span className="font-semibold capitalize">{aiResult.speechClarity}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
