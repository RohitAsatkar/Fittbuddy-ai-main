import { Motion } from '@capacitor/motion';
import { BehaviorSubject } from 'rxjs';

export interface StepData {
  count: number;
  goal: number;
  timestamp: number;
  date: string;  // ISO date string YYYY-MM-DD
}

export class StepTrackingService {
  private static instance: StepTrackingService;
  private stepCount: number = 0;
  private stepGoal: number = 10000;
  private lastAcceleration: { x: number; y: number; z: number } | null = null;
  private stepThreshold = 1.2; // Lower threshold for easier detection
  private isTracking = false;
  private simulationInterval: ReturnType<typeof setInterval> | null = null;
  private stepHistory: StepData[] = [];
  private lastStepTime = 0;
  private minStepInterval = 300; // Shorter interval for more responsive detection
  private lastMagnitude = 0;
  private inStep = false;
  private stepSubject = new BehaviorSubject<StepData>({
    count: 0,
    goal: 10000,
    timestamp: Date.now(),
    date: new Date().toISOString().split('T')[0]
  });

  private constructor() {
    this.loadSavedData();
    this.loadHistory();
  }

  public static getInstance(): StepTrackingService {
    if (!StepTrackingService.instance) {
      StepTrackingService.instance = new StepTrackingService();
    }
    return StepTrackingService.instance;
  }

  private loadSavedData() {
    try {
      const savedData = localStorage.getItem('stepData');
      if (savedData) {
        const { count, goal } = JSON.parse(savedData);
        this.stepCount = count;
        this.stepGoal = goal;
        this.emitStepUpdate();
      }
    } catch (error) {
      console.error('Error loading saved step data:', error);
    }
  }

  private saveData() {
    try {
      localStorage.setItem('stepData', JSON.stringify({
        count: this.stepCount,
        goal: this.stepGoal,
        timestamp: Date.now(),
        date: new Date().toISOString().split('T')[0]
      }));
    } catch (error) {
      console.error('Error saving step data:', error);
    }
  }

  public loadStepData(): StepData {
    return {
      count: this.stepCount,
      goal: this.stepGoal,
      timestamp: Date.now(),
      date: new Date().toISOString().split('T')[0]
    };
  }

  public async startTracking(): Promise<void> {
    if (this.isTracking) return;
    
    try {
      // Request permission on Android
      if ((window as any).Android) {
        const result = await this.requestPermissions();
        if (!result) {
          throw new Error('Permission denied for activity recognition');
        }
      }
      
      await Motion.addListener('accel', (event) => {
        this.processAccelerometerData(event.acceleration);
      });
      this.isTracking = true;
      this.emitStepUpdate();
    } catch (error) {
      console.error('Failed to initialize step tracking:', error);
      throw error;
    }
  }

  private async requestPermissions(): Promise<boolean> {
    try {
      const { results } = await (window as any).Android.requestPermissions([
        'android.permission.ACTIVITY_RECOGNITION',
        'android.permission.HIGH_SAMPLING_RATE_SENSORS'
      ]);
      return Object.values(results).every(result => result === 'granted');
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  public stopTracking(): void {
    if (!this.isTracking) return;
    
    Motion.removeAllListeners();
    this.isTracking = false;
    this.stopSimulation();
    this.emitStepUpdate();
  }

  public startSimulation(): void {
    if (this.simulationInterval) return;
    
    this.simulationInterval = setInterval(() => {
      this.incrementSteps();
    }, 2000); // Simulate a step every 2 seconds
    
    this.isTracking = true;
    this.emitStepUpdate();
  }

  private stopSimulation(): void {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }

  private processAccelerometerData(acceleration: { x: number; y: number; z: number }) {
    const currentTime = Date.now();
    
    if (!this.lastAcceleration) {
      this.lastAcceleration = acceleration;
      return;
    }

    // Focus more on vertical movement (y-axis)
    const magnitude = Math.sqrt(
      Math.pow(acceleration.x - this.lastAcceleration.x, 2) * 0.5 +
      Math.pow(acceleration.y - this.lastAcceleration.y, 2) * 2.0 + // Give more weight to vertical movement
      Math.pow(acceleration.z - this.lastAcceleration.z, 2) * 0.5
    );

    // Simple peak detection
    if (!this.inStep && magnitude > this.stepThreshold && magnitude > this.lastMagnitude) {
      this.inStep = true;
    } else if (this.inStep && magnitude < this.stepThreshold * 0.6) {
      // Complete step pattern detected (peak followed by valley)
      this.inStep = false;
      
      // Check if enough time has passed since last step
      if (currentTime - this.lastStepTime >= this.minStepInterval) {
        this.lastStepTime = currentTime;
        this.incrementSteps();
      }
    }

    this.lastMagnitude = magnitude;
    this.lastAcceleration = acceleration;
  }

  private incrementSteps() {
    this.stepCount++;
    this.emitStepUpdate();
    this.saveData();
    console.log('Step detected:', this.stepCount); // Add logging for debugging
  }

  private emitStepUpdate() {
    const stepData = {
      count: this.stepCount,
      goal: this.stepGoal,
      timestamp: Date.now(),
      date: new Date().toISOString().split('T')[0]
    };
    this.stepSubject.next(stepData);
    this.addToHistory(stepData);
  }

  private addToHistory(stepData: StepData) {
    // Find if we already have an entry for today
    const todayIndex = this.stepHistory.findIndex(entry => entry.date === stepData.date);
    
    if (todayIndex !== -1) {
      // Update existing entry
      this.stepHistory[todayIndex] = stepData;
    } else {
      // Add new entry
      this.stepHistory.push(stepData);
    }
    
    // Keep only last 90 days
    if (this.stepHistory.length > 90) {
      this.stepHistory = this.stepHistory.slice(-90);
    }
    
    // Save history to localStorage
    this.saveHistory();
  }

  private saveHistory() {
    try {
      localStorage.setItem('stepHistory', JSON.stringify(this.stepHistory));
    } catch (error) {
      console.error('Error saving step history:', error);
    }
  }

  private loadHistory() {
    try {
      const savedHistory = localStorage.getItem('stepHistory');
      if (savedHistory) {
        this.stepHistory = JSON.parse(savedHistory);
      }
    } catch (error) {
      console.error('Error loading step history:', error);
    }
  }

  public getStepHistory(days: number): StepData[] {
    // Return last n days of history
    return this.stepHistory
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-days);
  }

  public getStepUpdates() {
    return this.stepSubject.asObservable();
  }

  public resetStepCount() {
    this.stepCount = 0;
    this.emitStepUpdate();
    this.saveData();
  }

  public setGoal(goal: number) {
    this.stepGoal = goal;
    this.emitStepUpdate();
    this.saveData();
  }
}
