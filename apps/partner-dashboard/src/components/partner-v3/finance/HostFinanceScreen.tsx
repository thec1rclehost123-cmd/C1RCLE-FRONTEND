import { PartnerFinanceScreen, type PartnerFinanceScreenProps } from './PartnerFinanceScreen';

import type { HostFinanceData } from '@/data/partner-data-source';

type HostFinanceScreenProps = Omit<PartnerFinanceScreenProps, 'baseHref' | 'data'> & { readonly data: HostFinanceData };

export function HostFinanceScreen({ data, ...props }: HostFinanceScreenProps) {
  return <PartnerFinanceScreen {...props} data={data} baseHref="/partner/host/finance" />;
}
