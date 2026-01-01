export interface DocumentSource {
  content: string;
  similarity: number;
  metadata?: {
    title?: string;
    [key: string]: any;
  };
}
