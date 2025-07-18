import { ChatMessage } from "@/types";
import { TrainingQA } from "@/types/training";

interface TrainingMetrics {
  confidenceScore: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  responseTime: number;
  contextRelevance: number;
}

interface Conversation {
  userMessage: string;
  aiResponse: string;
  timestamp: Date;
  context?: {
    userProfile?: string;
    previousMessages?: string[];
  };
  feedback: {
    helpful: boolean;
    category?: string;
    accuracy?: number;
    sentiment?: string;
    improvement?: string;
  };
  metrics: TrainingMetrics;
}

interface TrainingStore {
  conversations: Conversation[];
  qaData: TrainingQA[];
  categories: Set<string>;
  performance: {
    avgConfidence: number;
    avgResponseTime: number;
    successRate: number;
  };
  initializeWithDataset: (dataset: any) => number;
}

// Create a single instance of the training store
const createTrainingStore = () => {
  const store: TrainingStore = {
    conversations: [],
    qaData: [],
    categories: new Set(),
    performance: {
      avgConfidence: 0,
      avgResponseTime: 0,
      successRate: 0
    },
    initializeWithDataset: (dataset: any): number => {
      try {
        store.qaData = [];
        store.categories.clear();

        // Add exercise instructions and muscle targeting QA pairs
        const exerciseInstructions = store.qaData.concat([
          {
            question: "What muscles do push-ups work?",
            answer: "Push-ups primarily target the chest (pectorals), shoulders (deltoids), and triceps. They also engage the core muscles and to a lesser extent, the back muscles for stability.",
            category: "exercise",
            relatedTopics: ["chest", "shoulders", "triceps", "form"],
            keywords: ["push-ups", "muscles", "chest", "shoulders"],
            intentType: "information"
          },
          {
            question: "How do I perform a proper squat?",
            answer: "1. Stand with feet shoulder-width apart\n2. Keep chest up, back straight\n3. Lower your body by bending knees and hips\n4. Keep knees in line with toes\n5. Go as low as comfortable\n6. Push through heels to return to start\n7. Keep core engaged throughout",
            category: "exercise",
            relatedTopics: ["legs", "form", "technique"],
            keywords: ["squat", "form", "technique", "legs"],
            intentType: "instruction"
          },
        ]);

        // Add workout plans based on different goals
        const workoutPlans = store.qaData.concat([
          {
            question: "What's a good muscle gain workout plan?",
            answer: `Here's a 5-day split for muscle gain:
              Day 1: Chest and Triceps
              Day 2: Back and Biceps
              Day 3: Rest
              Day 4: Legs and Core
              Day 5: Shoulders and Arms
              
              Key tips:
              - Focus on compound movements
              - Aim for 3-4 sets of 8-12 reps
              - Rest 60-90 seconds between sets
              - Progressive overload is crucial`,
            category: "exercise",
            relatedTopics: ["muscle gain", "workout split", "training"],
            keywords: ["muscle gain", "workout plan", "split", "routine"],
            intentType: "recommendation"
          }
        ]);

        // Add diet and nutrition QA pairs
        const nutritionData = store.qaData.concat([
          {
            question: "What should I eat for muscle gain?",
            answer: `For muscle gain, focus on:
              1. Protein: 1.6-2.2g per kg bodyweight
              2. Carbs: 4-7g per kg bodyweight
              3. Healthy fats: 20-30% of total calories
              
              Key foods:
              - Lean meats, fish, eggs
              - Rice, potatoes, oats
              - Nuts, avocados, olive oil
              - Green vegetables
              
              Eat in a caloric surplus of 300-500 calories`,
            category: "nutrition",
            relatedTopics: ["muscle gain", "diet", "protein", "calories"],
            keywords: ["diet", "muscle gain", "nutrition", "food"],
            intentType: "recommendation"
          }
        ]);

        // Process existing dataset if available
        if (dataset.exercise_data) {
          dataset.exercise_data.forEach(entry => {
            if (!entry.exercises || Object.keys(entry).length === 0) return;

            // Add workout routines
            if (entry.routine) {
              store.qaData.push({
                question: `What's a good ${entry.goal} workout for ${entry.fitness_level} level?`,
                answer: `For ${entry.goal}, I recommend a ${entry.routine.weekly_split} routine. Sessions last ${entry.routine.duration_per_session} at ${entry.routine.intensity} intensity. Equipment needed: ${entry.routine.equipment_needed.join(', ')}.`,
                category: "exercise",
                relatedTopics: [entry.goal, entry.fitness_level, entry.target_area],
                keywords: [entry.goal, entry.fitness_level, entry.target_area, "routine"],
                intentType: "recommendation"
              });
            }

            // Add exercise instructions
            entry.exercises.forEach(exercise => {
              store.qaData.push({
                question: `How do I perform ${exercise.name}?`,
                answer: `${exercise.instructions} Perform ${exercise.sets} sets of ${exercise.reps} reps with ${exercise.rest_time} rest between sets.`,
                category: "exercise",
                relatedTopics: ["form", "technique", exercise.name],
                keywords: [exercise.name, "form", "technique", "instructions"],
                intentType: "instruction"
              });
            });
          });
        }

        // Add diet plans if available
        if (dataset.diet_data) {
          dataset.diet_data.forEach(diet => {
            if (diet.goal && diet.daily_calories) {
              store.qaData.push({
                question: `What's a good diet plan for ${diet.goal}?`,
                answer: `For ${diet.goal}, aim for ${diet.daily_calories} calories with ${diet.macros.protein} protein, ${diet.macros.carbs} carbs, and ${diet.macros.fats} fats. Key recommendations: ${diet.recommendations.join('. ')}.`,
                category: "nutrition",
                relatedTopics: ["diet", diet.goal, "macros"],
                keywords: [diet.goal, "diet", "nutrition", "macros"],
                intentType: "recommendation"
              });
            }
          });
        }

        // Add categories
        store.categories.add("exercise");
        store.categories.add("nutrition");

        console.log(`Processed ${store.qaData.length} QA pairs from dataset`);
        return store.qaData.length;
      } catch (error) {
        console.error('Error initializing dataset:', error);
        throw error;
      }
    }
  };

  return store;
};

let trainingStore = createTrainingStore();

const analyzeSentiment = (text: string): 'positive' | 'negative' | 'neutral' => {
  const positiveWords = ['great', 'good', 'helpful', 'excellent', 'perfect', 'thanks'];
  const negativeWords = ['bad', 'wrong', 'incorrect', 'not', "don't", 'poor'];
  
  const lowerText = text.toLowerCase();
  const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
  const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
  
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
};

// Implementation moved to store.initializeWithDataset

// Export functions to interact with the store
export const getTrainingStore = () => trainingStore;

export const addConversation = (userMessage: string, aiResponse: string) => {
    const startTime = Date.now();
    const confidence = calculateConfidence(aiResponse, userMessage);
    const sentiment = analyzeSentiment(userMessage);
    
    const conversation: Conversation = {
        userMessage,
        aiResponse,
        timestamp: new Date(),
        feedback: {
            helpful: true
        },
        metrics: {
            confidenceScore: confidence,
            sentiment,
            responseTime: Date.now() - startTime,
            contextRelevance: confidence
        }
    };

    trainingStore.conversations.push(conversation);
    updatePerformanceMetrics();
};

const calculateConfidence = (response: string, query: string): number => {
    const minLength = 50;
    const maxLength = 500;
    
    const lengthScore = Math.min(
        response.length > minLength ? 1 : response.length / minLength,
        response.length < maxLength ? 1 : maxLength / response.length
    );
    
    const keywords = query.toLowerCase().split(' ');
    const keywordMatches = keywords.filter(word => 
        response.toLowerCase().includes(word)
    ).length;
    const keywordScore = keywordMatches / keywords.length;
    
    return (lengthScore * 0.4 + keywordScore * 0.6) * 100;
};

const updatePerformanceMetrics = () => {
    const conversations = trainingStore.conversations;
    if (conversations.length === 0) return;

    const totalConfidence = conversations.reduce((sum, conv) => sum + conv.metrics.confidenceScore, 0);
    const totalResponseTime = conversations.reduce((sum, conv) => sum + conv.metrics.responseTime, 0);
    const helpfulResponses = conversations.filter(conv => conv.feedback.helpful).length;

    trainingStore.performance = {
        avgConfidence: totalConfidence / conversations.length,
        avgResponseTime: totalResponseTime / conversations.length,
        successRate: (helpfulResponses / conversations.length) * 100
    };
};

export const getRelevantTrainingData = (query: string): TrainingQA[] => {
    // Simple keyword matching for relevance
    const keywords = query.toLowerCase().split(' ');
    return trainingStore.qaData.filter(qa =>
        qa.keywords.some(keyword =>
            keywords.some(queryWord =>
                keyword.toLowerCase().includes(queryWord) ||
                queryWord.includes(keyword.toLowerCase())
            )
        )
    );
};

export const addFeedback = (messageId: string, feedback: { helpful: boolean; category?: string; accuracy?: number }) => {
    const conversation = trainingStore.conversations.find(conv => 
        conv.userMessage === messageId || conv.aiResponse === messageId
    );
    
    if (conversation) {
        conversation.feedback = {
            ...conversation.feedback,
            ...feedback
        };
        updatePerformanceMetrics();
    }
};
