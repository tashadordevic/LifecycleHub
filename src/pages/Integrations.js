import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Database, BarChart3, HeadphonesIcon, MessageSquare } from 'lucide-react';

const INTEGRATION_TYPES = [
  { type: 'CRM', icon: Database, color: 'text-blue-400', bg: 'bg-blue-400/10', providers: [
    { name: 'HubSpot' },
    { name: 'Salesforce' },
    { name: 'Pipedrive' }
  ]},
  { type: 'Analytics', icon: BarChart3, color: 'text-green-400', bg: 'bg-green-400/10', providers: [
    { name: 'Segment' },
    { name: 'Mixpanel' },
    { name: 'Amplitude' }
  ]},
  { type: 'Support', icon: HeadphonesIcon, color: 'text-orange-400', bg: 'bg-orange-400/10', providers: [
    { name: 'Zendesk' },
    { name: 'Intercom' },
    { name: 'Freshdesk' }
  ]},
  { type: 'Messaging', icon: MessageSquare, color: 'text-purple-400', bg: 'bg-purple-400/10', providers: [
    { name: 'Intercom' },
    { name: 'Customer.io' },
    { name: 'SendGrid' }
  ]}
];

export default function Integrations() {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-heading font-bold">Integrations</h1>
        <p className="text-muted-foreground mt-1">Connect your tools to LifecycleHub</p>
      </div>

      <div className="rounded-lg border border-border bg-secondary/30 px-6 py-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <p className="font-medium">Integrations are coming in a future release</p>
          <p className="text-sm text-muted-foreground mt-1">
            Native API connections to your CRM, analytics, support, and messaging tools are in active development.
            Star the <a href="https://github.com/tashadordevic/LifecycleHub" target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">GitHub repo</a> to get notified when they ship.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {INTEGRATION_TYPES.map(({ type, icon: Icon, color, bg, providers }) => (
          <Card key={type}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-base">
                <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                {type}
                <Badge variant="outline" className="ml-auto text-xs text-muted-foreground">
                  Coming Soon
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {providers.map(({ name }) => (
                  <div
                    key={name}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/50 opacity-60"
                  >
                    <span className="text-sm font-medium">{name}</span>
                    <Badge variant="outline" className="text-xs">Soon</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
