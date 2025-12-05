import Link from 'next/link';
import { ArrowLeft, Home } from 'lucide-react';

export function BackToDashboard() {
	return (
		<Link
			href="/"
			className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
		>
			<ArrowLeft className="w-4 h-4" />
			<Home className="w-4 h-4" />
			<span>Back to Dashboard</span>
		</Link>
	);
}

