import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
	label: string;
	href?: string;
}

interface BreadcrumbProps {
	items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
	return (
		<nav className="flex items-center gap-2 text-sm text-gray-600 mb-4">
			{items.map((item, index) => {
				const isLast = index === items.length - 1;
				
				return (
					<div key={index} className="flex items-center gap-2">
						{item.href && !isLast ? (
							<Link
								href={item.href}
								className="hover:text-gray-900 transition-colors"
							>
								{item.label}
							</Link>
						) : (
							<span className={isLast ? 'text-gray-900 font-semibold' : ''}>
								{item.label}
							</span>
						)}
						{!isLast && (
							<ChevronRight className="w-4 h-4 text-gray-400" />
						)}
					</div>
				);
			})}
		</nav>
	);
}

