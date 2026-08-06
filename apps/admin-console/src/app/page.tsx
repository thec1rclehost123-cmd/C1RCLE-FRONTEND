import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@c1rcle/ui';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Overview',
};

export default function OverviewPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">C1RCLE Admin Console</h1>
        <p className="max-w-prose text-sm text-muted-foreground">
          Platform operations, users and oversight.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Shared design system</CardTitle>
            <CardDescription>
              Every surface is composed from @c1rcle/ui and the shared token set.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Components are defined once and consumed by all three applications.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>One network client</CardTitle>
            <CardDescription>All backend calls go through @c1rcle/api-client.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Auth, retries, timeouts, correlation IDs and typed errors live in one place.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Independent deploy</CardTitle>
            <CardDescription>This application builds and ships on its own.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            A failure here cannot take down the other two.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
