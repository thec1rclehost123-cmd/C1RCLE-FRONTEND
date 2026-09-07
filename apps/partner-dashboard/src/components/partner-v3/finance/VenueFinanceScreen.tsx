import { PartnerFinanceScreen, type PartnerFinanceScreenProps } from './PartnerFinanceScreen';

import type { VenueFinanceData } from '@/data/partner-data-source';

type VenueFinanceScreenProps = Omit<PartnerFinanceScreenProps, 'baseHref' | 'data'> & { readonly data: VenueFinanceData };

export function VenueFinanceScreen({ data, ...props }: VenueFinanceScreenProps) {
  return <PartnerFinanceScreen {...props} data={data} baseHref="/partner/venue/finance" />;
}
