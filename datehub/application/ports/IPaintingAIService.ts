export interface GeneratePaintingResult {
  imageUrl: string;
  palette: string[];
}

export interface IPaintingAIService {
  generateReference(difficulty: string, theme: string): Promise<GeneratePaintingResult>;
}
