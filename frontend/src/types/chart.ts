import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
  ChartData,
  ChartOptions,
  TooltipItem,
  ScriptableContext
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

// Re-export ChartData for use in components
export type { ChartData, ChartOptions };

// ============= CHART TYPE DEFINITIONS =============

export interface DoughnutChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor?: string[];
    borderWidth?: number;
  }[];
}

export interface LineChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor?: string;
    fill?: boolean;
    tension?: number;
  }[];
}

export interface BarChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}

export type ChartType = 'line' | 'bar' | 'doughnut' | 'pie' | 'polar' | 'radar';

// FIXED TYPE DEFINITIONS FOR YOUR PROJECT
export interface SecurityChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string | string[];
    borderColor: string;
    borderWidth?: number;
    tension?: number;
    fill?: boolean;
  }[];
}


export interface EventLogEntry {
  id: string;
  timestamp: string;
  type: 'security' | 'access' | 'maintenance' | 'alert';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
}

// CHART OPTIONS TEMPLATES
export const lineChartOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
    },
    title: {
      display: true,
      text: 'Security Metrics Over Time'
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      max: 100
    }
  }
};

export const doughnutChartOptions: ChartOptions<'doughnut'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
    },
    title: {
      display: true,
      text: 'Security Status Distribution'
    },
  }
};

export const barChartOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
    },
    title: {
      display: true,
      text: 'Daily Event Summary'
    },
  },
  scales: {
    y: {
      beginAtZero: true
    }
  }
}; 