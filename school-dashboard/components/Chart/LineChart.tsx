import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import React from 'react';
import { Line } from 'react-chartjs-2';
import { backgroundColors, borderColors } from './chartColors';

ChartJS.register(ArcElement);
ChartJS.register(Tooltip);
ChartJS.register(Legend);
ChartJS.register(PointElement);
ChartJS.register(LineElement);
ChartJS.register(CategoryScale);
ChartJS.register(LinearScale);
ChartJS.register(Filler);

interface ChartDataItem {
  item: string;
  data: number;
}

interface LineChartProps {
  title: string;
  chartData: ChartDataItem[];
  label: string;
}

const options = {
  scales: {
    y: {
      type: 'linear' as const,
      position: 'right' as const,
      max: 45000,
      min: 0,
    },
    y1: {
      type: 'linear' as const,
      position: 'left' as const,
      min: 0,
    },
  },
  animation: {
    easing: 'easeInBounce' as const,
    duration: 1500,
  },
  responsive: true,
  stacked: false,
  maintainAspectRatio: false,
  legend: {
    display: true,
  },
};

const LineChart: React.FC<LineChartProps> = ({ title, chartData, label }) => {
  const labels = chartData?.map((item) => item?.item?.slice(0, 10)) ?? [];
  const dataToChart = chartData?.map((item) => Number(item.data)) ?? [];
  // cumulateive data is an array of the sum of all the previous values
  const cumulativeData = dataToChart.reduce((acc, curr) => {
    acc.push(((acc.length && acc[acc.length - 1]) || 0) + curr);
    return acc;
  }, [] as number[]);
  const marbleData = dataToChart.map((item) => Math.round(item / 5));

  const data = {
    labels,
    datasets: [
      {
        label: 'Cumulative Cards',
        data: cumulativeData,
        backgroundColor: backgroundColors[8],
        borderColor: borderColors[8],
        borderWidth: 1,
        yAxisID: 'y',
        tension: 0.3,
        fill: true,
      },
      {
        label,
        data: marbleData,
        backgroundColor: backgroundColors[0],
        borderColor: borderColors[0],
        borderWidth: 1,
        yAxisID: 'y1',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  return (
    <>
      <Line data={data} options={options} />
    </>
  );
};

export default LineChart;
