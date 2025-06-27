import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const diffInMs = now.getTime() - targetDate.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  } else {
    return targetDate.toLocaleDateString();
  }
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    water: 'bg-blue-100 text-blue-800',
    roads: 'bg-yellow-100 text-yellow-800',
    electricity: 'bg-green-100 text-green-800',
    health: 'bg-red-100 text-red-800',
    education: 'bg-purple-100 text-purple-800',
    waste: 'bg-orange-100 text-orange-800',
    other: 'bg-gray-100 text-gray-800',
  };
  return colors[category.toLowerCase()] || colors.other;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    under_review: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    resolved: 'bg-green-100 text-green-800',
    escalated_local: 'bg-orange-100 text-orange-800',
    escalated_state: 'bg-red-100 text-red-800',
    escalated_national: 'bg-purple-100 text-purple-800',
  };
  return colors[status] || colors.under_review;
}

export function getStatusText(status: string): string {
  const texts: Record<string, string> = {
    under_review: 'Under Review',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    escalated_local: 'Escalated Local',
    escalated_state: 'Escalated State',
    escalated_national: 'Escalated National',
  };
  return texts[status] || 'Under Review';
}

export function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
  };
  return colors[severity] || colors.medium;
}

export function calculateVISColor(visScore: number): string {
  if (visScore >= 90) return 'text-green-600';
  if (visScore >= 70) return 'text-blue-600';
  if (visScore >= 50) return 'text-yellow-600';
  return 'text-gray-600';
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function getEscalationThreshold(supportPercentage: number): {
  level: string;
  color: string;
  description: string;
} {
  if (supportPercentage >= 50) {
    return {
      level: 'National',
      color: 'bg-purple-100 text-purple-800',
      description: '50%+ Support - National Attention'
    };
  } else if (supportPercentage >= 25) {
    return {
      level: 'State',
      color: 'bg-red-100 text-red-800',
      description: '25%+ Support - State Level'
    };
  } else if (supportPercentage >= 20) {
    return {
      level: 'Hot Zone',
      color: 'bg-red-100 text-red-800',
      description: '20%+ Support - Hot Zone'
    };
  } else if (supportPercentage >= 10) {
    return {
      level: 'Local',
      color: 'bg-orange-100 text-orange-800',
      description: '10%+ Support - Local Escalation'
    };
  }
  return {
    level: 'Community',
    color: 'bg-blue-100 text-blue-800',
    description: 'Community Level'
  };
}
