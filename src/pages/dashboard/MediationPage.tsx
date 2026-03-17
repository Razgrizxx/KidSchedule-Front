import { Scale, Construction } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function MediationPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-xl font-bold text-slate-800">Mediation</h2>
          <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
        </div>
        <p className="text-sm text-slate-400">Neutral dispute resolution tools for co-parents</p>
      </div>

      <Card>
        <CardContent className="py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-4">
            <Scale className="w-8 h-8 text-teal-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Mediation Center</h3>
          <p className="text-slate-400 text-sm max-w-sm mx-auto mb-4 leading-relaxed">
            AI-assisted neutral communication, dispute logs, and structured co-parenting agreements
            — coming in the next release.
          </p>
          <div className="flex items-center justify-center gap-2 text-slate-300">
            <Construction className="w-4 h-4" />
            <span className="text-xs">Under construction</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
