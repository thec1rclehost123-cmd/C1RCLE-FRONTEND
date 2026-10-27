import { formatFreshness } from '@c1rcle/utils';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card.js';

import type { ReactNode } from 'react';

export interface ChartFrameProps {
  readonly title: string;
  readonly description?: string;
  readonly generatedAt?: string | Date;
  readonly locale?: string;
  readonly timeZone?: string;
  readonly children: ReactNode;
}

export function ChartFrame({
  title,
  description,
  generatedAt,
  locale = 'en-IN',
  timeZone = 'Asia/Kolkata',
  children,
}: ChartFrameProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description ? <CardDescription>{description}</CardDescription> : null}
          </div>
          {generatedAt ? (
            <p className="text-xs text-muted-foreground">
              {formatFreshness(generatedAt, locale, timeZone)}
            </p>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
