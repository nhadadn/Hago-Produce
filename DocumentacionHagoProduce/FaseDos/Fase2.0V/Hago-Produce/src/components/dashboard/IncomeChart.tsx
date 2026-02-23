"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const data = [
  {
    name: "Ene",
    total: 12000,
  },
  {
    name: "Feb",
    total: 18000,
  },
  {
    name: "Mar",
    total: 15000,
  },
  {
    name: "Abr",
    total: 21000,
  },
  {
    name: "May",
    total: 19000,
  },
  {
    name: "Jun",
    total: 24000,
  },
];

export function IncomeChart() {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Ingresos Mensuales</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <XAxis
              dataKey="name"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              formatter={(value: any) => [`$${value}`, "Ingresos"]}
              cursor={{ fill: "transparent" }}
            />
            <Bar dataKey="total" fill="#0f172a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
