import { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from './card';

interface KPICardProps {
	title: string;
	value: ReactNode;
	icon?: ReactNode;
	trend?: {
		value: number;
		label?: string;
	};
	tone?: 'positive' | 'negative' | 'neutral';
	className?: string;
	highlighted?: boolean;
}

export function KPICard({
	title,
	value,
	icon,
	trend,
	tone = 'neutral',
	className,
	highlighted = false
}: KPICardProps) {
	const toneStyles = {
		positive: 'text-green-600',
		negative: 'text-red-600',
		neutral: 'text-blue-600'
	};

	const iconColor = toneStyles[tone];

	return (
		<Card highlighted={highlighted} className={className}>
			<div className="flex items-center justify-between">
				<div className="flex-1">
					<p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
					<div className="flex items-baseline gap-2">
						<p className="text-3xl font-bold text-gray-900">{value}</p>
						{trend && (
							<div
								className={cn(
									'flex items-center gap-1 text-sm font-medium',
									trend.value >= 0 ? 'text-green-600' : 'text-red-600'
								)}
							>
								{trend.value >= 0 ? (
									<TrendingUp className="w-4 h-4" />
								) : (
									<TrendingDown className="w-4 h-4" />
								)}
								<span>
									{trend.value >= 0 ? '+' : ''}
									{trend.value.toFixed(1)}%
								</span>
								{trend.label && <span className="text-gray-500">({trend.label})</span>}
							</div>
						)}
					</div>
				</div>
				{icon && (
					<div className={cn('opacity-70', iconColor)}>
						{icon}
					</div>
				)}
			</div>
		</Card>
	);
}

