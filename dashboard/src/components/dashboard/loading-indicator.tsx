'use client';

import { useEffect, useState } from 'react';
import { LoadingStatus } from '@/lib/data-cache';
import { Loader2 } from 'lucide-react';

export function LoadingIndicator() {
	const [status, setStatus] = useState<LoadingStatus | null>(null);
	const [isVisible, setIsVisible] = useState(true);

	useEffect(() => {
		const checkStatus = async () => {
			try {
				const response = await fetch('/api/loading-status');
				if (response.ok) {
					const data: LoadingStatus = await response.json();
					setStatus(data);
					
					// Ocultar si la carga está completa
					if (!data.isLoading && data.loaded > 0) {
						// Esperar un momento antes de ocultar para mostrar el 100%
						setTimeout(() => setIsVisible(false), 1000);
					}
				}
			} catch (error) {
				console.error('Error checking loading status:', error);
			}
		};

		// Verificar estado inmediatamente
		checkStatus();

		// Verificar cada 200ms mientras está cargando
		const interval = setInterval(() => {
			checkStatus();
		}, 200);

		return () => clearInterval(interval);
	}, []);

	if (!isVisible || !status || (!status.isLoading && status.loaded === 0)) {
		return null;
	}

	const percentage = status.percentage || (status.estimatedTotal 
		? Math.min(95, (status.loaded / status.estimatedTotal) * 100)
		: undefined);

	return (
		<div className="fixed top-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50 min-w-[300px]">
			<div className="flex items-center gap-3 mb-3">
				<Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
				<div className="flex-1">
					<h3 className="text-sm font-semibold text-gray-900">
						{status.isLoading ? 'Loading data...' : 'Load completed'}
					</h3>
					<p className="text-xs text-gray-600">
						{status.loaded.toLocaleString()} records
					</p>
				</div>
			</div>

			{status.isLoading && percentage !== undefined && (
				<div className="mb-2">
					<div className="flex justify-between text-xs text-gray-600 mb-1">
						<span>{percentage.toFixed(1)}%</span>
						<span>{status.rate > 0 ? `${Math.floor(status.rate).toLocaleString()} records/s` : ''}</span>
					</div>
					<div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
						<div
							className="bg-blue-600 h-2 rounded-full transition-all duration-200 ease-out"
							style={{ width: `${percentage}%` }}
						/>
					</div>
				</div>
			)}

			{!status.isLoading && status.loaded > 0 && (
				<div className="text-xs text-green-600 font-medium">
					✓ {status.loaded.toLocaleString()} records loaded ({status.bytesMB.toFixed(2)} MB)
				</div>
			)}

			<div className="text-xs text-gray-500 mt-2">
				{status.bytesMB.toFixed(2)} MB processed
			</div>
		</div>
	);
}

