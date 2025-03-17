import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Layout from "../components/Layout";
import Head from 'next/head';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
//import QueryExecutor from '../components/QueryExecutor';
//import SampleQueries from '../components/SampleQueries';
//import Settings from '../components/Settings';

const IndexPage = () => {
  useEffect(() => {
    const handleMessage = (_event, args) => alert(args);

    // listen to the 'message' channel
    window.electron.receiveHello(handleMessage);

    return () => {
      window.electron.stopReceivingHello(handleMessage);
    };
  }, []);

  const [currentPage, setCurrentPage] = useState<string>('query');
  const [query, setQuery] = useState<string>('SELECT * FROM sample_data');
  const [queryExecutorRef, setQueryExecutorRef] = useState<any>(null);
  const onSayHiClick = () => {
    window.electron.sayHello();
  };

  const executeQueryRef = useCallback( ()=> {
    if(queryExecutorRef && queryExecutorRef.executeQuery) {
      queryExecutorRef.executeQuery();
    }
  }, [queryExecutorRef]);

  return (
    <Layout title="Home | Next.js + TypeScript + Electron Example">
      <h1>Hello Next.js?👋</h1>
      <button onClick={onSayHiClick}>Say hi to electron</button>
      <p>
        <Link href="/about">About</Link>
      </p>
    </Layout>
  );
};

export default IndexPage;
