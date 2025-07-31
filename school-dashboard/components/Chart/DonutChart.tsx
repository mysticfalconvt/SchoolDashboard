import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js';
import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { backgroundColors, borderColors } from './chartColors';

interface ChartDataItem {
  word: string;
  total: number;
}

interface DoughnutChartProps {
  title: string;
  chartData: ChartDataItem[];
}

const DoughnutChart: React.FC<DoughnutChartProps> = ({ title, chartData }) => {
  //   console.log(chartData);
  const labels = chartData?.map((item) => item.word) || [];
  const dataToChart = chartData?.map((item) => item.total) || [];
  //   console.log(dataToChart);

  ChartJS.register(ArcElement);
  ChartJS.register(Tooltip);
  ChartJS.register(Legend);

  const data = {
    labels,
    datasets: [
      {
        // label: '# of Votes',
        data: dataToChart,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 1,
      },
    ],
  };

  const options = {
    animation: {
      easing: 'easeOutBounce' as const,
      duration: 1500,
    },
    responsive: true,
    maintainAspectRatio: true,
    legend: {
      display: false,
    },
  };

  return (
    <div className="w-1/2">
      <div className="header">
        <h4 className="title">{title}</h4>
      </div>
      <Doughnut data={data} options={options} />
    </div>
  );
};

export default DoughnutChart;
