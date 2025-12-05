import { NextResponse } from 'next/server';
import { dataCache } from '@/lib/data-cache';

export async function GET(): Promise<NextResponse> {
	try {
		const status = dataCache.getLoadingStatus();
		return NextResponse.json(status);
	} catch (error) {
		console.error('[ERROR] Loading status error:', error);
		return NextResponse.json(
			{
				error: 'Internal server error',
				details: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
}

