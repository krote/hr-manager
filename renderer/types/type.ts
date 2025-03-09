export interface DataRow {
    [key: string]: any;
}

export interface QueryResult {
    data: DataRow[];
    error?: string;
}

export interface SampleQuery{
    name: string;
    query: string;
}