import { redirect } from 'next/navigation';

export default function HostFinanceOrdersPage() {
  redirect('/partner/host/finance?view=orders');
}
