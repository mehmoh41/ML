"use client";

import { suggestSignLanguageGestures } from "@/ai/flows/suggest-sign-language-gestures";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { Hand, Loader2, Sparkles, Type, Webcam } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import WebcamView from "../shared/webcam-view";
import { Badge } from "../ui/badge";

const existingGestures = ["A", "B", "C", "Hello", "Thank you"];

const formSchema = z.object({
  desiredCapabilities: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
});

export default function SignLanguageView() {
  const { toast } = useToast();
  const [recognizedText, setRecognizedText] = useState("...");

  const [suggestedGestures, setSuggestedGestures] = useState<string[] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      desiredCapabilities: "",
    },
  });

  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      setRecognizedText(existingGestures[currentIndex]);
      currentIndex = (currentIndex + 1) % existingGestures.length;
    }, 2500); // Change gesture every 2.5 seconds
    return () => clearInterval(interval);
  }, []);
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    setSuggestedGestures(null);
    try {
      const result = await suggestSignLanguageGestures({
        existingGestures,
        desiredCapabilities: values.desiredCapabilities,
      });
      setSuggestedGestures(result.suggestedGestures);
       toast({
        title: "Suggestions Received!",
        description: "AI has suggested new gestures to add.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "An error occurred.",
        description: "Failed to get suggestions from AI.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="flex flex-col gap-8 lg:col-span-2">
        <Card className="overflow-hidden shadow-lg">
          <CardHeader className="bg-muted/30">
            <CardTitle className="flex items-center gap-2">
              <Webcam className="text-primary" />
              Live Feed
            </CardTitle>
            <CardDescription>
              The model is analyzing your hand gestures in real-time.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative aspect-video">
              <WebcamView />
               <div className="absolute bottom-4 left-4 flex items-center gap-4 rounded-lg bg-background/80 p-4 shadow-md backdrop-blur-sm">
                <Type className="h-10 w-10 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Recognized Text</p>
                  <p className="text-2xl font-bold font-headline text-foreground">
                    {recognizedText}
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
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="text-accent" />
              Suggest New Gestures
            </CardTitle>
            <CardDescription>
              Use GenAI to suggest new gestures to expand the model's capabilities based on your needs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Label className="font-medium">Existing Gestures</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {existingGestures.map(g => <Badge key={g} variant="secondary">{g}</Badge>)}
              </div>
            </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="desiredCapabilities"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Desired Capabilities</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={`e.g., "I want to add gestures for common questions like 'who', 'what', 'where'."`}
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Describe the new signs you want the model to learn.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Get Suggestions
                </Button>
              </form>
            </Form>
          </CardContent>
          {suggestedGestures && (
            <CardFooter className="flex flex-col items-start gap-4 border-t pt-6">
              <CardTitle className="text-lg">AI Suggestions</CardTitle>
              <div className="flex flex-wrap gap-2">
                {suggestedGestures.map((gesture) => (
                    <Badge key={gesture} variant="default" className="bg-accent text-accent-foreground text-sm py-1 px-3">
                        {gesture}
                    </Badge>
                ))}
              </div>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
