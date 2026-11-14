import { AppDialogProvider } from '../components/app-dialog';
import './globals.css';
export const metadata = {
    title: 'Dr. Surendra Prasad Sah | Hematology, Biratnagar',
    description: 'Patient-friendly hematology information, procedures, treatments and appointment booking.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>
                <AppDialogProvider>
                    {children}
                </AppDialogProvider>
            </body>
        </html>
    )
}
