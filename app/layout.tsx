import './globals.css';
import Layout from '../components/Layout';
export const metadata = { title: 'Dr. Surendra Prasad Sah | Hematology, Biratnagar', description: 'Patient-friendly hematology information, procedures, treatments and appointment booking.' };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en"><body><Layout>{children}</Layout></body></html> }
