import { NextRequest } from 'next/server'
import { UAParser } from 'ua-parser-js'
import { prisma } from '@/lib/prisma'

// 1×1 transparent GIF
const PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
)

interface GeoResult {
  isp?: string
  org?: string
  as?: string
  country?: string
  countryCode?: string
  region?: string
  regionName?: string
  city?: string
  zip?: string
  lat?: number
  lon?: number
  timezone?: string
}

async function geolocate(ip: string): Promise<GeoResult> {
  // Skip loopback / private ranges
  if (!ip || ip === 'unknown' || /^(127\.|::1|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(ip)) {
    return {}
  }
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as`, {
      signal: AbortSignal.timeout(3000),
    })
    const data = await res.json()
    if (data.status !== 'success') return {}
    return {
      isp: data.isp,
      org: data.org,
      asn: data.as,
      country: data.country,
      countryCode: data.countryCode,
      region: data.region,
      regionName: data.regionName,
      city: data.city,
      zip: data.zip,
      lat: data.lat,
      lon: data.lon,
      timezone: data.timezone,
    } as GeoResult
  } catch {
    return {}
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const emailId = searchParams.get('id') ?? 'unknown'

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'

  const ua = request.headers.get('user-agent') ?? ''
  const parser = new UAParser(ua)
  const browser = parser.getBrowser()
  const os = parser.getOS()
  const device = parser.getDevice()

  // Determine device type — ua-parser-js leaves type undefined for desktops
  const deviceType = device.type ?? 'desktop'

  const [geo] = await Promise.all([geolocate(ip)])

  prisma.emailOpen.create({
    data: {
      emailId,
      ip,
      isp: geo.isp ?? null,
      org: geo.org ?? null,
      asn: (geo as { asn?: string }).asn ?? null,
      country: geo.country ?? null,
      countryCode: geo.countryCode ?? null,
      region: geo.region ?? null,
      regionName: geo.regionName ?? null,
      city: geo.city ?? null,
      zip: geo.zip ?? null,
      lat: geo.lat ?? null,
      lon: geo.lon ?? null,
      timezone: geo.timezone ?? null,
      userAgent: ua || null,
      referer: request.headers.get('referer') ?? null,
      acceptLanguage: request.headers.get('accept-language') ?? null,
      browserName: browser.name ?? null,
      browserVersion: browser.version ?? null,
      osName: os.name ?? null,
      osVersion: os.version ?? null,
      deviceType,
      deviceVendor: device.vendor ?? null,
      deviceModel: device.model ?? null,
    },
  }).catch((err: unknown) => console.error('[pixel] db write failed:', err))

  return new Response(PIXEL, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Content-Length': String(PIXEL.length),
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  })
}
