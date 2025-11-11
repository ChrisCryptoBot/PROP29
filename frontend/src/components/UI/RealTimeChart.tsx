import React, { useEffect, useRef, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
    fill?: boolean;
    tension?: number;
  }[];
}

interface RealTimeChartProps {
  type: 'line' | 'bar' | 'doughnut';
  data: ChartData;
  title?: string;
  height?: number;
  realTime?: boolean;
  updateInterval?: number;
  onDataUpdate?: (newData: ChartData) => void;
  options?: any;
}

const RealTimeChart: React.FC<RealTimeChartProps> = ({
  type,
  data,
  title,
  height = 300,
  realTime = false,
  updateInterval = 5000,
  onDataUpdate,
  options = {}
}) => {
  const [chartData, setChartData] = useState<ChartData>(data);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setChartData(data);
  }, [data]);

  useEffect(() => {
    if (realTime && onDataUpdate) {
      intervalRef.current = setInterval(() => {
        onDataUpdate(chartData);
      }, updateInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [realTime, updateInterval, onDataUpdate, chartData]);

  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#64748b',
          usePointStyle: true,
          padding: 20,
        },
      },
      title: title ? {
        display: true,
        text: title,
        color: '#1e293b',
        font: {
          size: 16,
          weight: 'bold',
        },
      } : undefined,
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#374151',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
      },
    },
    scales: type !== 'doughnut' ? {
      x: {
        grid: {
          color: 'rgba(100, 116, 139, 0.1)',
        },
        ticks: {
          color: '#64748b',
        },
      },
      y: {
        grid: {
          color: 'rgba(100, 116, 139, 0.1)',
        },
        ticks: {
          color: '#64748b',
        },
        beginAtZero: true,
      },
    } : undefined,
    elements: {
      line: {
        tension: 0.4,
      },
      point: {
        radius: 4,
        hoverRadius: 6,
      },
    },
    animation: {
      duration: 750,
      easing: 'easeInOutQuart',
    },
  };

  const mergedOptions = { ...defaultOptions, ...options };

  const renderChart = () => {
    switch (type) {
      case 'line':
        return <Line data={chartData} options={mergedOptions} height={height} />;
      case 'bar':
        return <Bar data={chartData} options={mergedOptions} height={height} />;
      case 'doughnut':
        return <Doughnut data={chartData} options={mergedOptions} height={height} />;
      default:
        return <Line data={chartData} options={mergedOptions} height={height} />;
    }
  };

  return (
    <div className="bg-white rounded-lg border p-4 shadow-sm">
      <div style={{ height }}>
        {renderChart()}
      </div>
      {realTime && (
        <div className="flex items-center justify-center mt-2">
          <div className="flex items-center gap-2 text-sm text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live Data</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealTimeChart; 