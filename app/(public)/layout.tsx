import Layout from '../../components/Layout';
import { redirectAuthenticatedAdmin } from '../../lib/auth/page-guard';

export const metadata = {
    title: 'Dr. Surendra Prasad Sah | Hematology, Biratnagar',
    description: 'Patient-friendly hematology information, procedures, treatments and appointment booking.'
};

export default async function ChildLayout({ children }: { children: React.ReactNode }) {
    await redirectAuthenticatedAdmin();
    return (
        <>
            <Layout>
                {children}
            </Layout>
        </>
    )
}
