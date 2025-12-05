'use client';

import { memo, useMemo } from 'react';
import { getChartColor } from '@/lib/chart-colors';

interface ProductCountriesTreemapProps {
	data: Array<{ country: string; kilos: number; percentage: number }>;
}

interface TreemapNode {
	x: number;
	y: number;
	width: number;
	height: number;
	country: string;
	kilos: number;
	percentage: number;
}

// Simple row-based treemap layout
function layoutTreemap(
	data: Array<{ country: string; kilos: number; percentage: number }>,
	width: number,
	height: number
): TreemapNode[] {
	const nodes: TreemapNode[] = [];

	// Sort by kilos descending
	const sorted = [...data].sort((a, b) => b.kilos - a.kilos);

	// Calculate number of rows (aim for roughly square layout)
	const numRows = Math.ceil(Math.sqrt(sorted.length));
	const rowHeight = height / numRows;

	let currentY = 0;
	let rowStart = 0;
	let rowKilos = 0;

	for (let i = 0; i < sorted.length; i++) {
		const item = sorted[i];
		rowKilos += item.kilos;

		// Determine if we should start a new row
		const itemsInRow = i - rowStart + 1;
		const isLast = i === sorted.length - 1;
		const targetItemsPerRow = Math.ceil(sorted.length / numRows);
		const shouldNewRow = isLast || (itemsInRow >= targetItemsPerRow && i < sorted.length - 1);

		if (shouldNewRow) {
			// Layout current row
			let currentX = 0;
			for (let j = rowStart; j <= i; j++) {
				const rowItem = sorted[j];
				const itemWidth = rowKilos > 0 ? (rowItem.kilos / rowKilos) * width : 0;

				nodes.push({
					x: currentX,
					y: currentY,
					width: itemWidth,
					height: rowHeight,
					country: rowItem.country,
					kilos: rowItem.kilos,
					percentage: rowItem.percentage
				});

				currentX += itemWidth;
			}

			currentY += rowHeight;
			rowStart = i + 1;
			rowKilos = 0;
		}
	}

	return nodes;
}

export const ProductCountriesTreemap = memo(function ProductCountriesTreemap({ data }: ProductCountriesTreemapProps) {
	const TREEMAP_WIDTH = 800;
	const TREEMAP_HEIGHT = 400;

	const nodes = useMemo(() => {
		if (!data || data.length === 0) return [];
		// Show top 20 countries to avoid overcrowding
		const topData = data.slice(0, 20);
		return layoutTreemap(topData, TREEMAP_WIDTH, TREEMAP_HEIGHT);
	}, [data]);

	if (!data || data.length === 0) {
		return (
			<div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
				<h2 className="text-xl font-bold text-gray-900 mb-4">
					Total Volume by Destination Country (Key Markets)
				</h2>
				<div className="flex items-center justify-center h-64 text-gray-500">
					No country data available
				</div>
			</div>
		);
	}

	return (
		<div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
			<h2 className="text-xl font-bold text-gray-900 mb-4">
				Total Volume by Destination Country (Key Markets)
			</h2>
			<div className="w-full overflow-x-auto">
				<svg
					width={TREEMAP_WIDTH}
					height={TREEMAP_HEIGHT}
					viewBox={`0 0 ${TREEMAP_WIDTH} ${TREEMAP_HEIGHT}`}
					className="w-full"
				>
					{nodes.map((node, index) => {
						const color = getChartColor(index);
						const fontSize = Math.min(12, Math.sqrt(node.width * node.height) / 8);
						const showLabel = node.width > 80 && node.height > 30;

						return (
							<g key={`${node.country}-${index}`}>
								<rect
									x={node.x}
									y={node.y}
									width={node.width}
									height={node.height}
									fill={color}
									stroke="#fff"
									strokeWidth={2}
									opacity={0.8}
								/>
								{showLabel && (
									<>
										<text
											x={node.x + node.width / 2}
											y={node.y + node.height / 2 - 6}
											textAnchor="middle"
											fontSize={fontSize}
											fontWeight="bold"
											fill="#fff"
											style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
										>
											{node.country.length > 15
												? node.country.substring(0, 15) + '...'
												: node.country}
										</text>
										<text
											x={node.x + node.width / 2}
											y={node.y + node.height / 2 + 8}
											textAnchor="middle"
											fontSize={fontSize - 2}
											fill="#fff"
											style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
										>
											{node.percentage.toFixed(1)}%
										</text>
									</>
								)}
							</g>
						);
					})}
				</svg>
			</div>
			<div className="mt-4 text-sm text-gray-600">
				<p>Larger squares represent countries with higher export volume. Showing top {Math.min(20, data.length)} countries.</p>
			</div>
		</div>
	);
});

