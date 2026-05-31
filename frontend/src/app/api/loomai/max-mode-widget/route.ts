import { NextResponse } from 'next/server';

const DEFAULT_WIDGET_URL =
  'https://loomai-partner-ui.46.224.145.148.sslip.io/max-mode-widget.iife.js?v=2026-04-14-opaque-shell-v1';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const widgetUrl = process.env.LOOMAI_MAX_MODE_WIDGET_SOURCE_URL || DEFAULT_WIDGET_URL;

  try {
    const response = await fetch(widgetUrl, {
      cache: 'no-store',
      headers: {
        accept: 'application/javascript,text/javascript,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      return new NextResponse('ProdUS AI widget is unavailable.', {
        status: 502,
        headers: responseHeaders(60),
      });
    }

    const body = await response.text();
    return new NextResponse(body, {
      status: 200,
      headers: responseHeaders(3600),
    });
  } catch {
    return new NextResponse('ProdUS AI widget is unavailable.', {
      status: 502,
      headers: responseHeaders(60),
    });
  }
}

function responseHeaders(maxAgeSeconds: number) {
  return {
    'Content-Type': 'application/javascript; charset=utf-8',
    'Cache-Control': `public, max-age=${maxAgeSeconds}`,
    'Cross-Origin-Resource-Policy': 'same-origin',
    'X-Content-Type-Options': 'nosniff',
  };
}
