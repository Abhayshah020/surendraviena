import Navbar from './Navbar'; import Footer from './Footer'; import FloatingActions from './FloatingActions';
export default function Layout({children}:{children:React.ReactNode}){return <><Navbar/><main>{children}</main><Footer/><FloatingActions/></>}
