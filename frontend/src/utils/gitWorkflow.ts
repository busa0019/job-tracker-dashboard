// src/utils/gitWorkflow.ts

export type GitActivity = {
  branchesCreated: number;
  pullRequests: number;
  mergeConflictsResolved: number;
  lastActivity: string;
};

export const logGitActivity = (
  branchesCreated: number,
  pullRequests: number,
  mergeConflictsResolved: number
): GitActivity => {
  return {
    branchesCreated,
    pullRequests,
    mergeConflictsResolved,
    lastActivity: new Date().toISOString(),
  };
};
