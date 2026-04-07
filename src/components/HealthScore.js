import { cn } from '../lib/utils';

export const getHealthColor = (score) => {
  if (score >= 70) return 'health-high';
  if (score >= 40) return 'health-medium';
  return 'health-low';
};

export const getHealthBgColor = (score) => {
  if (score >= 70) return 'bg-health-high';
  if (score >= 40) return 'bg-health-medium';
  return 'bg-health-low';
};

export const getHealthLabel = (score) => {
  if (score >= 70) return 'Healthy';
  if (score >= 40) return 'At Risk';
  return 'Critical';
};

export const HealthScore = ({ score, showLabel = false, size = 'default' }) => {
  const colorClass = getHealthColor(score);
  const bgColorClass = getHealthBgColor(score);
  
  const sizeClasses = {
    sm: 'text-xs',
    default: 'text-sm',
    lg: 'text-lg font-semibold',
  };

  return (
    <div className="flex items-center gap-2">
      <div className={cn('w-2 h-2 rounded-full', bgColorClass)} />
      <span className={cn(colorClass, sizeClasses[size])}>{score}</span>
      {showLabel && (
        <span className={cn('text-muted-foreground', sizeClasses[size])}>
          ({getHealthLabel(score)})
        </span>
      )}
    </div>
  );
};

export const HealthIndicator = ({ score, size = 'default' }) => {
  const bgColorClass = getHealthBgColor(score);
  
  const sizeClasses = {
    sm: 'w-1.5 h-1.5',
    default: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  };

  return (
    <div className={cn('rounded-full', bgColorClass, sizeClasses[size])} />
  );
};

export const HealthBadge = ({ score }) => {
  const colorClass = getHealthColor(score);
  const label = getHealthLabel(score);
  
  const bgClasses = {
    'health-high': 'bg-green-500/20',
    'health-medium': 'bg-yellow-500/20',
    'health-low': 'bg-red-500/20',
  };

  return (
    <span className={cn(
      'px-2 py-0.5 rounded text-xs font-medium',
      bgClasses[colorClass],
      colorClass
    )}>
      {label}
    </span>
  );
};
