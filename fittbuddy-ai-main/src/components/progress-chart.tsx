import React from 'react';
import { useUser } from "@/context/UserContext";
import { 
  BarChart as BarChartIcon, 
  Calendar, 
  Dumbbell, 
  TrendingUp, 
  Trophy,
  PieChart,
  Footprints
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StepCounter } from "./step-counter";
import { StepHistory } from "./step-history";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { EmptyState } from "./ui/empty-state";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useMemo, useEffect, useState } from "react";
import { StepTrackingService } from "@/services/StepTrackingService";
import { StepData } from "@/types";

export type TimeframeType = "weekly" | "monthly" | "all";
export type MetricType = "workouts" | "calories" | "duration" | "muscles" | "steps";

interface ProgressChartProps {
  timeframe: TimeframeType;
  metricType: MetricType;
}

interface ChartDataPoint {
  day?: string;
  date?: string;
  month?: string;
  count: number;
  calories: number;
  duration: number;
  name?: string;
  value?: number;
}

interface ChartProps {
  title: string;
  description: string;
  dataKey: string;
  fill?: string;
  nameKey?: string;
  label: string;
}

interface StatsDataProps {
  totalWorkouts: number;
  streakDays: number;
  lastWorkoutDate: string;
  fitnessGoal: string;
}

const COLORS = ["#9b87f5", "#4C4CFF", "#F97316", "#10B981", "#8B5CF6", "#EC4899"];

export function ProgressChart({ timeframe, metricType }: ProgressChartProps) {
  const { userProfile, completedWorkouts } = useUser();
  const [stepHistory, setStepHistory] = useState<StepData[]>([]);

  useEffect(() => {
    if ((metricType as MetricType) === "steps") {
      const stepService = StepTrackingService.getInstance();
      const history = stepService.getStepHistory(
        timeframe === "weekly" ? 7 : timeframe === "monthly" ? 30 : 90
      );
      setStepHistory(history);
    }
  }, [timeframe, metricType]);

  // Always declare chartData with useMemo before any conditional returns
  const chartData = useMemo(() => {
    // Only calculate chart data for non-step metrics when we have completed workouts
    if (metricType !== "steps" && completedWorkouts.length > 0) {
      // Filter workouts based on timeframe
      const now = new Date();
      let filteredWorkouts = [...completedWorkouts];
      
      if (timeframe === "weekly") {
        const oneWeekAgo = new Date(now);
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        filteredWorkouts = completedWorkouts.filter(workout => 
          new Date(workout.date) >= oneWeekAgo
        );
      } else if (timeframe === "monthly") {
        const oneMonthAgo = new Date(now);
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        filteredWorkouts = completedWorkouts.filter(workout => 
          new Date(workout.date) >= oneMonthAgo
        );
      }

      // Group and format data based on metric type
      if (metricType === "muscles") {
        // For muscle groups, we need a pie chart of most trained muscle groups
        const muscleGroups: Record<string, number> = {};
        
        filteredWorkouts.forEach(workout => {
          const workoutDetails = userProfile?.workoutsCompleted > 0 ? 
            { targetMuscleGroups: ["Full Body"] } : { targetMuscleGroups: [] };
          
          workoutDetails.targetMuscleGroups.forEach(group => {
            if (!muscleGroups[group]) muscleGroups[group] = 0;
            muscleGroups[group]++;
          });
        });
        
        return Object.entries(muscleGroups).map(([name, value]) => ({ name, value }));
      } else {
        // For other metrics, prepare time series data
        let groupedData: Record<string, any> = {};
        
        if (timeframe === "weekly") {
          // Group by day of week
          const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
          days.forEach(day => {
            groupedData[day] = { day, count: 0, calories: 0, duration: 0 };
          });
          
          filteredWorkouts.forEach(workout => {
            const day = days[new Date(workout.date).getDay()];
            groupedData[day].count++;
            groupedData[day].calories += 300; // Placeholder value
            groupedData[day].duration += workout.duration;
          });
          
          return Object.values(groupedData);
        } else if (timeframe === "monthly") {
          // Group by date within the month
          filteredWorkouts.forEach(workout => {
            const date = new Date(workout.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (!groupedData[date]) {
              groupedData[date] = { date, count: 0, calories: 0, duration: 0 };
            }
            groupedData[date].count++;
            groupedData[date].calories += 300; // Placeholder value
            groupedData[date].duration += workout.duration;
          });
          
          return Object.values(groupedData);
        } else {
          // All time - group by month
          filteredWorkouts.forEach(workout => {
            const month = new Date(workout.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
            if (!groupedData[month]) {
              groupedData[month] = { month, count: 0, calories: 0, duration: 0 };
            }
            groupedData[month].count++;
            groupedData[month].calories += 300; // Placeholder value
            groupedData[month].duration += workout.duration;
          });
          
          return Object.values(groupedData);
        }
      }
    }
    
    // Return empty array as fallback
    return [];
  }, [completedWorkouts, timeframe, metricType, userProfile]);

  // Define chartProps outside any conditional blocks to avoid hook ordering issues
  const chartProps = useMemo(() => {
    switch (metricType) {
      case "workouts":
        return {
          title: "Workout Frequency",
          description: `Number of workouts completed ${timeframe === "weekly" ? "this week" : timeframe === "monthly" ? "this month" : "all time"}`,
          dataKey: "count",
          fill: "#9b87f5",
          label: "Workouts"
        };
      case "calories":
        return {
          title: "Calories Burned",
          description: `Estimated calories burned ${timeframe === "weekly" ? "this week" : timeframe === "monthly" ? "this month" : "all time"}`,
          dataKey: "calories",
          fill: "#F97316",
          label: "Calories"
        };
      case "duration":
        return {
          title: "Workout Duration",
          description: `Total workout time ${timeframe === "weekly" ? "this week" : timeframe === "monthly" ? "this month" : "all time"}`,
          dataKey: "duration",
          fill: "#10B981",
          label: "Minutes"
        };
      case "muscles":
        return {
          title: "Muscle Groups Trained",
          description: `Distribution of muscle groups trained ${timeframe === "weekly" ? "this week" : timeframe === "monthly" ? "this month" : "all time"}`,
          dataKey: "value",
          nameKey: "name",
          label: "Sessions"
        };
      default:
        return {
          title: "Workout Frequency",
          description: `Number of workouts completed ${timeframe === "weekly" ? "this week" : timeframe === "monthly" ? "this month" : "all time"}`,
          dataKey: "count",
          fill: "#9b87f5",
          label: "Workouts"
        };
    }
  }, [timeframe, metricType]);
  
  // Stats cards - declare before any conditional returns
  const statsData = useMemo(() => ({
    totalWorkouts: userProfile?.workoutsCompleted || 0,
    streakDays: userProfile?.streakDays || 0,
    lastWorkoutDate: userProfile?.lastWorkoutDate ? 
      new Date(userProfile.lastWorkoutDate).toLocaleDateString() : "Never",
    fitnessGoal: userProfile?.fitnessGoal?.replace("_", " ") || "Not set"
  }), [userProfile]);

  // Now we can handle conditional rendering
  if (!userProfile) {
    return (
      <EmptyState
        icon={<BarChartIcon className="h-6 w-6" />}
        title="No Profile Found"
        description="Create your profile to track your fitness progress"
        action={
          <Button asChild>
            <Link to="/profile">Create Profile</Link>
          </Button>
        }
      />
    );
  }

  if (metricType === "steps") {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <StepCounter className="lg:row-span-2" />
          <Card className="shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-fitness-purple" />
                Step Statistics
              </CardTitle>
              <CardDescription>Your {timeframe === "weekly" ? "weekly" : timeframe === "monthly" ? "monthly" : "all time"} insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Average Steps</p>
                  <p className="text-2xl font-bold">
                    {stepHistory.length > 0
                      ? Math.round(
                          stepHistory.reduce((acc, day) => acc + day.count, 0) /
                            stepHistory.length
                        ).toLocaleString()
                      : "0"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Goal Reached</p>
                  <p className="text-2xl font-bold">
                    {stepHistory.filter(day => day.count >= day.goal).length} days
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Steps</p>
                  <p className="text-2xl font-bold">
                    {stepHistory
                      .reduce((acc, day) => acc + day.count, 0)
                      .toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Best Day</p>
                  <p className="text-2xl font-bold">
                    {stepHistory.length > 0
                      ? Math.max(...stepHistory.map(day => day.count)).toLocaleString()
                      : "0"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <StepHistory data={stepHistory} timeframe={timeframe} />
          
          {stepHistory.length > 0 && (
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Step History</CardTitle>
                <CardDescription>
                  Your step count over the {timeframe === "weekly" ? "past week" : timeframe === "monthly" ? "past month" : "past 90 days"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stepHistory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => {
                          const d = new Date(date);
                          return d.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          });
                        }} 
                      />
                      <YAxis />
                      <Tooltip 
                        formatter={(value) => [`${value.toLocaleString()} steps`, 'Steps']}
                        labelFormatter={(date) => {
                          const d = new Date(date);
                          return d.toLocaleDateString('en-US', { 
                            weekday: 'long',
                            month: 'long', 
                            day: 'numeric' 
                          });
                        }}
                      />
                      <Bar dataKey="count" name="Steps" fill="#9b87f5" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="goal" name="Goal" fill="#E2E8F0" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  if (completedWorkouts.length === 0) {
    return (
      <EmptyState
        icon={<Dumbbell className="h-6 w-6" />}
        title="No Workouts Yet"
        description="Complete your first workout to start tracking your progress"
        action={
          <Button asChild>
            <Link to="/workouts">Browse Workouts</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="hover-scale transition-transform">
          <CardHeader className="card-header-compact">
            <CardDescription>Total Workouts</CardDescription>
          </CardHeader>
          <CardContent className="card-content-compact">
            <div className="flex items-center">
              <Dumbbell className="h-5 w-5 mr-2" style={{ color: 'var(--fitness-purple)' }} />
              <CardTitle>{statsData.totalWorkouts}</CardTitle>
            </div>
          </CardContent>
        </Card>
        <Card className="hover-scale transition-transform">
          <CardHeader className="card-header-compact">
            <CardDescription>Current Streak</CardDescription>
          </CardHeader>
          <CardContent className="card-content-compact">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" style={{ color: 'var(--fitness-orange)' }} />
              <CardTitle>{statsData.streakDays} days</CardTitle>
            </div>
          </CardContent>
        </Card>
        <Card className="hover-scale transition-transform">
          <CardHeader className="card-header-compact">
            <CardDescription>Last Active</CardDescription>
          </CardHeader>
          <CardContent className="card-content-compact">
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" style={{ color: 'var(--fitness-blue)' }} />
              <CardTitle>{statsData.lastWorkoutDate}</CardTitle>
            </div>
          </CardContent>
        </Card>
        <Card className="hover-scale transition-transform">
          <CardHeader className="card-header-compact">
            <CardDescription>Goal</CardDescription>
          </CardHeader>
          <CardContent className="card-content-compact">
            <div className="flex items-center">
              <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
              <CardTitle className="capitalize">{statsData.fitnessGoal}</CardTitle>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Chart */}
      <Card className="shadow-md hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle>{chartProps.title}</CardTitle>
          <CardDescription>{chartProps.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              {(metricType as MetricType) === "muscles" ? (
                <RechartsPieChart>
                  <Pie
                    data={chartData}
                    nameKey="name"
                    dataKey="value"
                    className="chart-pie"
                    fill="#8884d8"
                    label
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} sessions`, 'Total']} />
                  <Legend />
                </RechartsPieChart>
              ) : timeframe === "weekly" ? (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} ${chartProps.label}`, 'Total']} />
                  <Bar dataKey={chartProps.dataKey} name={chartProps.label} fill={chartProps.fill} className="chart-bar" />
                </BarChart>
              ) : (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={timeframe === "all" ? "month" : "date"} />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} ${chartProps.label}`, 'Total']} />
                  <Line 
                    type="monotone" 
                    dataKey={chartProps.dataKey} 
                    stroke={chartProps.fill} 
                    strokeWidth={2}
                    dot={<circle className="chart-dot" />}
                    activeDot={<circle className="chart-active-dot" />}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
