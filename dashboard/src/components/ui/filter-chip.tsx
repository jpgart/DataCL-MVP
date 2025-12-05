import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterChipProps {
	label: string;
	onRemove: () => void;
	className?: string;
}

export function FilterChip({ label, onRemove, className }: FilterChipProps) {
	return (
		<div
			className={cn(
				'inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-sm text-gray-700 hover:bg-gray-200 transition-colors',
				className
			)}
		>
			<span>{label}</span>
			<button
				onClick={onRemove}
				className="ml-1 hover:text-gray-900 transition-colors"
				aria-label={`Remove filter: ${label}`}
			>
				<X className="w-3 h-3" />
			</button>
		</div>
	);
}

