import { getTrainingStore } from './trainingStore';
import path from 'path';
import fs from 'fs';

interface TrainingResult {
    success: boolean;
    qaCount?: number;
    error?: string;
}

export const initializeTraining = async (datasetPath: string): Promise<TrainingResult> => {
    try {
        const store = getTrainingStore();
        
        // Read dataset file synchronously to ensure data is loaded
        const fullPath = path.resolve(process.cwd(), datasetPath);
        console.log('Loading dataset from:', fullPath);
        
        const dataset = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        
        // Log dataset statistics
        const validExercises = dataset.exercise_data?.filter((entry: any) => 
            Object.keys(entry).length > 0 && entry.exercises?.length > 0
        );
        
        console.log('Dataset statistics:', {
            totalEntries: dataset.exercise_data?.length || 0,
            validEntries: validExercises?.length || 0,
            dietEntries: dataset.diet_data?.length || 0
        });

        const qaCount = store.initializeWithDataset(dataset);
        
        if (qaCount === 0) {
            throw new Error('No training data was processed');
        }

        console.log(`Successfully processed ${qaCount} QA pairs from the dataset`);
        return {
            success: true,
            qaCount
        };
    } catch (error) {
        console.error('Training initialization failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
};