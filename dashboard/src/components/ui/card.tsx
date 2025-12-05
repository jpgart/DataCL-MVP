import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
	children: ReactNode;
	className?: string;
	highlighted?: boolean;
	compact?: boolean;
}

export function Card({ children, className, highlighted = false, compact = false }: CardProps) {
	return (
		<div
			className={cn(
				'bg-white rounded-lg shadow-sm border border-gray-200',
				compact ? 'p-4' : 'p-6',
				highlighted && 'border-blue-300 bg-blue-50/30',
				className
			)}
		>
			{children}
		</div>
	);
}

