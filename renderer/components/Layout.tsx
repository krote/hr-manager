import React, { ReactNode } from "react";
import Link from "next/link";
import Head from "next/head";
import Sidebar from './Sidebar';
import Header from './Header';


type Props = {
  children: ReactNode;
  title?: string;
};

const Layout = ({children, title=""}) => {
  return (
    <div className="flex flex-row h-screen w-full overflow-hidden bg-gray-100">
      <div className="h-full">
        <Sidebar/>
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4">
          {children}
        </main>
      </div>
    </div>
  )
}

/*
const Layout = ({ children, title = "This is the default title" }: Props) => (
  <div>
    <Head>
      <title>{title}</title>
      <meta charSet="utf-8" />
      <meta name="viewport" content="initial-scale=1.0, width=device-width" />
    </Head>
    <header>
      <nav>
        <Link href="/">Home</Link> | <Link href="/about">About</Link> |{" "}
        <Link href="/initial-props">With Initial Props</Link>
      </nav>
    </header>
    {children}
    <footer>
      <hr />
      <span>I'm here to stay (Footer)</span>
    </footer>
  </div>
);
*/
export default Layout;
