import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Layout from "../components/Layout";
import Head from 'next/head';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import QueryExecutor from '../components/QueryExecutor';
//import SampleQueries from '../components/SampleQueries';
import Settings from '../components/Settings';

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
  const queryExecutorRef = useRef<any>(null);
  const onSayHiClick = () => {
    window.electron.sayHello();
  };

  const executeQuery = useCallback( ()=> {
    if(queryExecutorRef.current) {
      queryExecutorRef.current.executeQuery();
    }
  }, []);

  // クエリ文字列が変更されたとき
  const handleQueryChange = useCallback( (newQuery: string) => {
    setQuery(newQuery);
  }, []);
  
  const renderContent = () => {
    switch (currentPage) {
      case 'query':
        return (
          <QueryExecutor 
            ref={queryExecutorRef} 
            initialQuery={query} 
            onQueryChange={handleQueryChange} 
          />
        );
      case 'sample':
        return (
          <SampleQueries 
            setQuery={handleSelectQuery} 
            executeQuery={executeQuery} 
          />
        );
      case 'settings':
        return <Settings />;
      default:
        return <div>ページが見つかりません</div>;
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <Head>
        <title>SQLite ビューア</title>
        <meta name="description" content="SQLiteデータベースを操作・可視化するためのアプリケーション" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
        <main className="flex-1 overflow-auto bg-gray-50">
          {renderContent()}
        </main>
      </div>
    </div>
   );
};

export default IndexPage;
