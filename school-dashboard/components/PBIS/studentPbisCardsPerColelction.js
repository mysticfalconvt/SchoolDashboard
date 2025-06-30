import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale, // for the x-axis
  LinearScale, // for the y-axis
  BarElement, // for bar charts
  Title, // for the chart title
  Tooltip, // for tooltips
  Legend // for the legend
);

export default function StudentPbisCardsPerCollection({ cards }) {
  const cardsByWeek = cards.reduce((acc, card) => {
    const cardDate = new Date(card.dateGiven);
    const weekStart = new Date(
      cardDate.getFullYear(),
      cardDate.getMonth(),
      cardDate.getDate() - cardDate.getDay()
    );
    if (!acc[weekStart]) {
      acc[weekStart] = 0;
    }
    acc[weekStart] += 1;
    return acc;
  }, {});

  const cardsArray = Object.keys(cardsByWeek).map((key) => cardsByWeek[key]);
  const datesArray = Object.keys(cardsByWeek).map((key) =>
    new Date(key).toLocaleDateString()
  );

  const data = {
    labels: datesArray, // Dates array as labels
    datasets: [
      {
        label: "Cards per week",
        data: cardsArray, // Cards array as data
        backgroundColor: "#38b6ff",
        borderColor: "#5b0a06",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    scales: {
      y: {
        beginAtZero: true,
      },
    },
    plugins: {
      legend: {
        display: false, // Hide legend if not needed
      },
    },
    responsive: true,
    maintainAspectRatio: false, // Allows adjusting the height dynamically
  };

  return (
    <>
      <h3 style={{ textAlign: "center" }}>Cards per week</h3>

      <div style={{ width: "100%", height: 150 }}>
        <Bar data={data} options={options} />
      </div>
    </>
  );
}
