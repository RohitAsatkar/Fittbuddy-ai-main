import { useEffect, useState } from 'react';
import { initializeTraining } from '@/data/training/initializeTraining';
import { getTrainingStore } from '@/data/training/trainingStore';

export const useTrainingSystem = () => {
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        const initTraining = async () => {
            try {
                console.log('Starting training initialization...');
                const result = await initializeTraining('src/data/training/fitness_dataset.json');
                
                if (result.success) {
                    console.log(`Successfully processed ${result.qaCount} training examples`);
                    // Get training store to verify data
                    const store = getTrainingStore();
                    console.log('Training categories:', Array.from(store.categories));
                    console.log('First few QA pairs:', store.qaData.slice(0, 3));
                    setIsInitialized(true);
                } else {
                    console.error('Training initialization failed:', result.error);
                }
            } catch (error) {
                console.error('Error during training initialization:', error);
            }
        };

        if (!isInitialized) {
            initTraining();
        }
    }, [isInitialized]);

    return {
        isInitialized,
        getTrainingStore
    };
};
