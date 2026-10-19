import { redirect } from 'next/navigation';

export default function VenueFinanceOrdersPage() {
  redirect('/partner/venue/finance?view=orders');
}
