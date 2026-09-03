import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/auth';

export default async function DashboardPage() {
    await verifySession();
    
    // Rediriger vers la page analytics
    redirect('/dashboard/analytics');
}