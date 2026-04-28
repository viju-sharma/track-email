import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function OpensPage() {
  const opens = await prisma.emailOpen.findMany({
    orderBy: { openedAt: 'desc' },
    take: 200,
  })

  const total = await prisma.emailOpen.count()

  return (
    <main className="p-8 font-mono text-sm text-gray-900 bg-white min-h-screen">
      <h1 className="text-2xl font-bold mb-1">Email Opens</h1>
      <p className="text-gray-500 mb-6">{total} open event(s) total</p>

      <div className="mb-8 p-4 bg-gray-100 rounded text-xs">
        <p className="font-bold mb-1">Embed in your email HTML:</p>
        <code className="break-all">
          {'<img src="https://track-email-swart.vercel.app/api/pixel?id=YOUR_EMAIL_ID" width="1" height="1" alt="" />'}
        </code>
      </div>

      {opens.length === 0 ? (
        <p className="text-gray-400">No opens recorded yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-gray-200 text-left">
                <th className="p-2 border">Email ID</th>
                <th className="p-2 border">Opened At</th>
                <th className="p-2 border">City</th>
                <th className="p-2 border">Country</th>
                <th className="p-2 border">Browser</th>
                <th className="p-2 border">OS</th>
                <th className="p-2 border">Device</th>
                <th className="p-2 border">IP</th>
                <th className="p-2 border">ISP</th>
                <th className="p-2 border">Language</th>
              </tr>
            </thead>
            <tbody>
              {opens.map((o) => (
                <tr key={o.id} className="odd:bg-white even:bg-gray-50">
                  <td className="p-2 border font-bold">{o.emailId}</td>
                  <td className="p-2 border whitespace-nowrap">
                    {new Date(o.openedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                  </td>
                  <td className="p-2 border">{[o.city, o.regionName].filter(Boolean).join(', ') || '—'}</td>
                  <td className="p-2 border">{o.country ? `${o.country} (${o.countryCode})` : '—'}</td>
                  <td className="p-2 border">{[o.browserName, o.browserVersion].filter(Boolean).join(' ') || '—'}</td>
                  <td className="p-2 border">{[o.osName, o.osVersion].filter(Boolean).join(' ') || '—'}</td>
                  <td className="p-2 border capitalize">{o.deviceType ?? '—'}{o.deviceVendor ? ` · ${o.deviceVendor}` : ''}</td>
                  <td className="p-2 border">{o.ip ?? '—'}</td>
                  <td className="p-2 border max-w-xs truncate" title={o.isp ?? ''}>{o.isp ?? '—'}</td>
                  <td className="p-2 border">{o.acceptLanguage?.split(',')[0] ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
