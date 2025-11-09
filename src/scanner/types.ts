export type ConsolidatedIssue = { 
  category: string; 
  description: string; 
  severity: 'low' | 'medium' | 'high' 
};

export type AiPatch = { 
  diff: string; 
  rationale: string 
};

export type ConsolidatedResult = {
  fileName: string;
  fileType: string;
  isValid: boolean;
  issues: ConsolidatedIssue[];
  aiSuggestedPatches: AiPatch[];
  rationale?: string;
};
