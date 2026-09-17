import {
  BarElement,
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
);

const PBIS_CARDS_PER_TA_LEVEL = 24;

interface PbisCard {
  dateGiven: string;
}

interface TaStudent {
  allCards?: PbisCard[];
}

interface PbisCollectionDate {
  collectionDate: string;
}

interface TaPbisCollectionChartProps {
  students: TaStudent[];
  collectionDates: PbisCollectionDate[];
  currentAverage: number;
}

export interface TaPbisCollectionPoint {
  collectionDate: string;
  cards: number;
  cardsPerStudent: number;
  cumulativeCardsPerStudent: number;
  level: number;
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

export function getTaPbisCollectionPoints(
  students: TaStudent[],
  collectionDates: PbisCollectionDate[],
  currentAverage: number,
): TaPbisCollectionPoint[] {
  if (students.length === 0) return [];

  const dates = Array.from(
    new Set(
      collectionDates
        .map(({ collectionDate }) => collectionDate)
        .filter((date) => !Number.isNaN(new Date(date).getTime())),
    ),
  ).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  const cardDates = students
    .flatMap((student) => student.allCards || [])
    .map(({ dateGiven }) => new Date(dateGiven).getTime())
    .filter((date) => !Number.isNaN(date))
    .sort((a, b) => a - b);

  let cardIndex = 0;
  const points = dates.map((collectionDate) => {
    const collectionTime = new Date(collectionDate).getTime();
    let cards = 0;

    while (
      cardIndex < cardDates.length &&
      cardDates[cardIndex] <= collectionTime
    ) {
      cards += 1;
      cardIndex += 1;
    }

    return {
      collectionDate,
      cards,
      cardsPerStudent: cards / students.length,
      cumulativeCardsPerStudent: 0,
      level: 0,
    };
  });

  // Work backward from the saved average so the latest point matches the
  // collection process even if the TA roster changed during the year.
  let cumulativeCardsPerStudent = Math.max(0, currentAverage || 0);
  for (let index = points.length - 1; index >= 0; index -= 1) {
    points[index].cumulativeCardsPerStudent = cumulativeCardsPerStudent;
    points[index].level = Math.floor(
      cumulativeCardsPerStudent / PBIS_CARDS_PER_TA_LEVEL,
    );
    cumulativeCardsPerStudent = Math.max(
      0,
      cumulativeCardsPerStudent - points[index].cardsPerStudent,
    );
  }

  return points;
}

export default function TaPbisCollectionChart({
  students,
  collectionDates,
  currentAverage,
}: TaPbisCollectionChartProps) {
  const isDark = useDarkMode();
  const points = getTaPbisCollectionPoints(
    students,
    collectionDates,
    currentAverage,
  );

  if (points.length === 0) return null;

  const textColor = isDark ? "rgb(220, 220, 220)" : "rgb(10, 10, 10)";
  const gridColor = isDark
    ? "rgba(220, 220, 220, 0.16)"
    : "rgba(10, 10, 10, 0.12)";
  const lineColor = isDark ? "rgb(248, 113, 113)" : "rgb(118, 13, 8)";

  const data = {
    labels: points.map((point) =>
      new Date(point.collectionDate).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
    ),
    datasets: [
      {
        type: "bar" as const,
        label: "Cards per student this collection",
        data: points.map((point) => point.cardsPerStudent),
        backgroundColor: "rgba(56, 182, 255, 0.5)",
        borderColor: "rgba(56, 182, 255, 1)",
        borderWidth: 1,
        order: 2,
      },
      {
        type: "line" as const,
        label: "Cumulative cards per student",
        data: points.map((point) => point.cumulativeCardsPerStudent),
        borderColor: lineColor,
        backgroundColor: isDark
          ? "rgba(248, 113, 113, 0.15)"
          : "rgba(118, 13, 8, 0.15)",
        pointBackgroundColor: points.map((point, index) =>
          index > 0 && point.level > points[index - 1].level
            ? "rgba(120, 192, 145, 1)"
            : lineColor,
        ),
        pointRadius: 4,
        tension: 0.2,
        order: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: gridColor,
        },
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
          text: "Cards per student",
          color: textColor,
        },
      },
      x: {
        grid: {
          color: gridColor,
        },
        ticks: {
          color: textColor,
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: textColor,
        },
      },
      tooltip: {
        callbacks: {
          afterBody: (items: Array<{ dataIndex: number }>) => {
            const point = points[items[0]?.dataIndex];
            if (!point) return "";
            return [`${point.cards} total cards`, `TA level ${point.level}`];
          },
        },
      },
    },
  };

  return (
    <section className="my-6 rounded-lg border border-[var(--tableAccentColor)] bg-[var(--backgroundColor)] p-4 text-[var(--textColor)] shadow-sm">
      <h2 className="text-center text-xl font-semibold">
        TA PBIS Progress by Collection
      </h2>
      <p className="mb-3 text-center text-sm text-[var(--textColor)] opacity-75">
        Bars show cards earned per student between collection dates. Green
        points mark a new TA level.
      </p>
      <div className="h-80 w-full">
        <Chart type="bar" data={data} options={options} />
      </div>
    </section>
  );
}
