'use client';

import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/lib/utils';

interface VirtualizedListItem {
	label: string;
	value: string;
}

interface VirtualizedListProps {
	items: VirtualizedListItem[];
	selectedValues: string[];
	onSelect: (value: string) => void;
	maxHeight?: number;
	className?: string;
}

export function VirtualizedList({
	items,
	selectedValues,
	onSelect,
	maxHeight = 200,
	className
}: VirtualizedListProps) {
	const parentRef = useRef<HTMLDivElement>(null);

	const virtualizer = useVirtualizer({
		count: items.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 32,
		overscan: 5
	});

	if (items.length === 0) {
		return (
			<div className={cn('flex items-center justify-center p-4 text-sm text-gray-500', className)}>
				No items found
			</div>
		);
	}

	return (
		<div
			ref={parentRef}
			className={cn('overflow-auto border border-gray-300 rounded-lg', className)}
			style={{ maxHeight: `${maxHeight}px` }}
		>
			<div
				style={{
					height: `${virtualizer.getTotalSize()}px`,
					width: '100%',
					position: 'relative'
				}}
			>
				{virtualizer.getVirtualItems().map(virtualItem => {
					const item = items[virtualItem.index];
					const isSelected = selectedValues.includes(item.value);

					return (
						<label
							key={virtualItem.key}
							style={{
								position: 'absolute',
								top: 0,
								left: 0,
								width: '100%',
								height: `${virtualItem.size}px`,
								transform: `translateY(${virtualItem.start}px)`
							}}
							className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50 px-2 rounded"
						>
							<input
								type="checkbox"
								checked={isSelected}
								onChange={() => onSelect(item.value)}
								className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
							/>
							<span className="text-sm text-gray-700">{item.label}</span>
						</label>
					);
				})}
			</div>
		</div>
	);
}

