import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSpeechSynthesis } from 'react-speech-kit';
import { motion } from 'framer-motion';
import { Mic, MicOff } from 'lucide-react';

const CookingAIBot = () => {
  const [dishName, setDishName] = useState('');
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [userPrompt, setUserPrompt] = useState('');
  const { speak } = useSpeechSynthesis();
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const speechRecognition = new window.webkitSpeechRecognition();
      speechRecognition.continuous = true;
      speechRecognition.interimResults = false;
      speechRecognition.lang = 'en-US';

      speechRecognition.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
        setUserPrompt(transcript);
        handleUserPrompt(transcript);
      };

      setRecognition(speechRecognition);
    }
  }, []);

  const startListening = () => {
    if (recognition) {
      recognition.start();
      setListening(true);
    }
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      setListening(false);
    }
  };

  const getCookingSteps = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/get-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dish: dishName }),
      });
      const data = await response.json();
      setSteps(data.steps || ["Recipe not found. Please try another dish."]);
      setCurrentStep(0);
    } catch (error) {
      console.error('Error fetching recipe:', error);
      setSteps(["Error fetching recipe. Please try again."]);
    } finally {
      setLoading(false);
    }
  };

  const handleUserPrompt = (promptText) => {
    const prompt = (promptText || userPrompt).toLowerCase();

    if (prompt.includes("next")) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
        speak({ text: steps[currentStep + 1] });
      }
    } else if (prompt.includes("repeat")) {
      speak({ text: steps[currentStep] });
    } else if (prompt.includes("start over")) {
      setCurrentStep(0);
      speak({ text: steps[0] });
    } else {
      speak({ text: "Sorry, I didn't understand the command." });
    }
    setUserPrompt('');
  };

  return (
    <div className="p-8 max-w-2xl mx-auto dark bg-gray-900 text-white min-h-screen">
      <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-3xl font-bold mb-8 text-center">
        🍳 Cooking AI Bot
      </motion.h1>

      <Card className="mb-6">
        <CardContent className="p-4 space-y-4">
          <Input
            placeholder="Enter dish name (e.g., Sushi, Tacos, Pasta)"
            value={dishName}
            onChange={(e) => setDishName(e.target.value)}
          />
          <Button onClick={getCookingSteps} className="w-full" disabled={loading}>
            {loading ? 'Loading...' : 'Get Cooking Steps'}
          </Button>
        </CardContent>
      </Card>

      {steps.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="mb-6">
            <CardContent className="p-4">
              <h2 className="text-xl font-semibold mb-2">Step {currentStep + 1}:</h2>
              <p className="text-lg">{steps[currentStep]}</p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="p-4 space-y-4">
              <Input
                placeholder="Type or say 'next', 'repeat', 'start over'"
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
              />
              <Button onClick={() => handleUserPrompt()} className="w-full">
                Submit Command
              </Button>
              <Button onClick={listening ? stopListening : startListening} className="flex items-center justify-center w-full gap-2">
                {listening ? <MicOff className="animate-pulse" /> : <Mic />} 
                {listening ? 'Stop Listening' : 'Start Voice Command'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default CookingAIBot;
