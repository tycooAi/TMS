'use client';

import { useParams } from 'next/navigation';
import { AccountsCustomerDetail } from '../../../../components/accounts/AccountsCustomerDetail';

export default function AccountsCustomerDetailPage() {
  const params = useParams();
  const customerId = Array.isArray(params?.customerId) ? params.customerId[0] : (params?.customerId as string) || '';

  return <AccountsCustomerDetail customerId={customerId} />;
}
