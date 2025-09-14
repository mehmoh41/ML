"use client";

import { analyzeAudio, AnalyzeAudioOutput } from "@/ai/flows/analyze-audio-for-voice-model";
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
import { Mic, MicOff, Loader2, Music, User, Sparkles, AlertTriangle, AudioLines, ShieldCheck } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Progress } from "../ui/progress";

declare global {
  interface Window {
    speechCommands: any;
    tf: any;
    stream: MediaStream;
    MediaRecorder: typeof MediaRecorder;
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
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeAudioOutput | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const recognizerRef = useRef<any | null>(null);

  const stopListening = useCallback(() => {
    if (recognizerRef.current && recognizerRef.current.isListening()) {
      recognizerRef.current.stopListening();
    }
    // Do not clear the recognizerRef here to reuse it
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
        const URL = window.location.origin + "/my_model/";
        const modelURL = URL + "model.json";
        const metadataURL = URL + "metadata.json";

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
          overlapFactor: 0.75,
        }
      );

    } catch (error) {
      console.error("Error initializing Teachable Machine:", error);
      setStatus("Error loading model. Please check permissions and refresh.");
      setIsListening(false);
      setLoading(false);
    }
  }, []);

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      window.stream = stream;
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          setIsAnalyzing(true);
          setAnalysisResult(null);
          try {
            const result = await analyzeAudio({ audioDataUri: base64Audio });
            setAnalysisResult(result);
            toast({ title: "Analysis Complete", description: "AI has analyzed your audio sample." });
          } catch (error) {
            toast({ variant: "destructive", title: "Analysis Failed", description: "Could not analyze the audio." });
          } finally {
            setIsAnalyzing(false);
          }
        };
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);

      setTimeout(() => {
        stopRecording();
      }, 3000); // Record for 3 seconds

    } catch (error) {
      toast({ variant: "destructive", title: "Recording Failed", description: "Could not access microphone." });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      window.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };
  
  useEffect(() => {
    // Cleanup on unmount
    return () => {
      stopListening();
      if(recognizerRef.current) {
        // recognizerRef.current.delete(); // This method might not exist, be careful
        recognizerRef.current = null;
      }
    };
  }, [stopListening]);

  const highestPrediction = predictions.reduce(
    (prev, current) => (prev.probability > current.probability ? prev : current),
    { className: "...", probability: 0 }
  );
  
  const isSinging = ['songs', 'qawali'].includes(highestPrediction.className) && highestPrediction.probability > 0.8;

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
      <div className="flex flex-col gap-8 md:col-span-2">
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
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="text-accent" />AI Audio Analysis</CardTitle>
            <CardDescription>Record a 3-second audio clip for the AI to analyze its quality and provide feedback before you start recognition.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={startRecording} disabled={isRecording || isAnalyzing || isListening}>
              {isRecording ? <Loader2 className="animate-spin" /> : <AudioLines />}
              <span>{isRecording ? 'Recording...' : 'Start 3s Audio Analysis'}</span>
            </Button>
          </CardContent>
          {(isAnalyzing || analysisResult) && (
            <CardFooter className="flex flex-col items-start gap-4 border-t pt-4">
              <h3 className="font-semibold">Analysis Results:</h3>
              {isAnalyzing && <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="animate-spin"/>Analyzing audio...</p>}
              {analysisResult && (
                <div className="grid gap-4 text-sm w-full">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-muted-foreground">Overall Quality:</span>
                    <span className={`font-bold ${analysisResult.overallQuality === 'good' ? 'text-green-600' : 'text-amber-600'}`}>{analysisResult.overallQuality}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Speech Clarity:</span>
                    <span>{analysisResult.speechClarity}</span>
                  </div>
                   <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Noise Level:</span>
                    <span>{analysisResult.noiseLevel}</span>
                  </div>
                   <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Music Present:</span>
                    <span>{analysisResult.musicPresence ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              )}
            </CardFooter>
          )}
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
