import { cn } from '@/lib/utils';

interface SkeletonProps {
	className?: string;
	variant?: 'text' | 'card' | 'chart' | 'small-block' | 'large-block';
}

const variantStyles = {
	text: 'h-4 w-full',
	card: 'h-32 w-full',
	chart: 'h-96 w-full',
	'small-block': 'h-20 w-20',
	'large-block': 'h-40 w-full'
};

export function Skeleton({ className, variant = 'text' }: SkeletonProps) {
	return (
		<div
			className={cn(
				'animate-pulse rounded bg-gray-200',
				variantStyles[variant],
				className
			)}
		/>
	);
}

// Pre-built skeleton components for common patterns
export function SkeletonCard() {
	return (
		<div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
			<Skeleton variant="text" className="mb-2 w-3/4" />
			<Skeleton variant="text" className="w-1/2" />
		</div>
	);
}

export function SkeletonKPICard() {
	return (
		<div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
			<Skeleton variant="text" className="mb-2 w-2/3" />
			<Skeleton variant="text" className="h-8 w-1/2 mb-2" />
			<Skeleton variant="small-block" className="w-6 h-6 rounded" />
		</div>
	);
}

export function SkeletonChart() {
	return (
		<div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
			<Skeleton variant="text" className="mb-4 w-1/3" />
			<Skeleton variant="chart" />
		</div>
	);
}

