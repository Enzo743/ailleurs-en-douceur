import { Header, Footer } from ".";

interface LayoutProps {
  children: React.ReactNode;
  currentPage?: string;
}

export default function Layout({ children, currentPage }: LayoutProps) {
  return (
    <>
      <Header currentPage={currentPage} />
      {children}
      <Footer />
    </>
  );
}
