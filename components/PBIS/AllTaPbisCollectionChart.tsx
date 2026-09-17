import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { useEffect, useState } from "react";
import { Chart } from "react-chartjs-2";
import { getTaPbisCollectionPoints } from "./TaPbisCollectionChart";

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
);

const PBIS_CARDS_PER_TA_LEVEL = 24;

interface TaStudent {
  allCards?: Array<{ dateGiven: string }>;
}

interface TA {
  id: string;
  name: string;
  taTeamAveragePbisCardsPerStudent: number;
  taStudents: TaStudent[];
}

interface CollectionDate {
  collectionDate: string;
}

interface AllTaPbisCollectionChartProps {
  teams: TA[];
  collectionDates: CollectionDate[];
}

function useDarkMode() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const updateTheme = () => setIsDark(root.classList.contains("dark"));
    const observer = new MutationObserver(updateTheme);

    updateTheme();
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  return isDark;
}

export default function AllTaPbisCollectionChart({
  teams,
  collectionDates,
}: AllTaPbisCollectionChartProps) {
  const isDark = useDarkMode();
  const visibleTeams = teams
    .filter((team) => team.taStudents.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name));

  if (visibleTeams.length === 0 || collectionDates.length === 0) return null;

  const textColor = isDark ? "rgb(220, 220, 220)" : "rgb(10, 10, 10)";
  const gridColor = isDark
    ? "rgba(220, 220, 220, 0.16)"
    : "rgba(10, 10, 10, 0.12)";
  const teamPoints = visibleTeams.map((team) => ({
    team,
    points: getTaPbisCollectionPoints(
      team.taStudents,
      collectionDates,
      team.taTeamAveragePbisCardsPerStudent,
    ),
  }));
  const labels = teamPoints[0].points.map((point) =>
    new Date(point.collectionDate).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
  );

  const data = {
    labels,
    datasets: teamPoints.map(({ team, points }, index) => {
      const hue = (index * 137.508) % 360;
      const color = `hsl(${hue}, 70%, ${isDark ? 65 : 40}%)`;

      return {
        label: team.name,
        data: points.map((point) => point.cumulativeCardsPerStudent),
        borderColor: color,
        backgroundColor: color,
        borderWidth: 2,
        pointRadius: 2,
        pointHoverRadius: 5,
        tension: 0.2,
      };
    }),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "nearest" as const,
      intersect: false,
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: gridColor },
        ticks: {
          color: textColor,
          stepSize: PBIS_CARDS_PER_TA_LEVEL,
          callback: (value: string | number) => {
            const numericValue = Number(value);
            return numericValue % PBIS_CARDS_PER_TA_LEVEL === 0
              ? `Level ${numericValue / PBIS_CARDS_PER_TA_LEVEL} (${numericValue})`
              : numericValue;
          },
        },
        title: {
          display: true,
          text: "Cumulative cards per student",
          color: textColor,
        },
      },
      x: {
        grid: { color: gridColor },
        ticks: { color: textColor },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (item: {
            dataset: { label?: string };
            parsed: { y: number };
          }) =>
            `${item.dataset.label}: ${item.parsed.y.toFixed(1)} cards/student (Level ${Math.floor(item.parsed.y / PBIS_CARDS_PER_TA_LEVEL)})`,
        },
      },
    },
  };

  return (
    <section className="hidePrint my-6 rounded-lg border border-[var(--tableAccentColor)] bg-[var(--backgroundColor)] p-4 text-[var(--textColor)] shadow-sm">
      <h2 className="text-center text-xl font-semibold">
        TA Progress by PBIS Collection
      </h2>
      <p className="mb-3 text-center text-sm text-[var(--textColor)] opacity-75">
        Each line shows a TA&apos;s cumulative cards per student at collection
        time.
      </p>
      <div className="h-[32rem] w-full">
        <Chart type="line" data={data} options={options} />
      </div>
    </section>
  );
}
