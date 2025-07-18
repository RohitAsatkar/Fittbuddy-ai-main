import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from "recharts";
import { StepData } from "@/types";

interface StepHistoryProps {
  data: StepData[];
  timeframe: "weekly" | "monthly" | "all";
}

export function StepHistory({ data, timeframe }: StepHistoryProps) {
  if (data.length === 0) {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Step History</CardTitle>
          <CardDescription>
            Start tracking your steps to see your history
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[350px] flex items-center justify-center text-muted-foreground">
          No step data available
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Step History</CardTitle>
        <CardDescription>
          Your step count over the {timeframe === "weekly" ? "past week" : timeframe === "monthly" ? "past month" : "past 90 days"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
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
  );
}
