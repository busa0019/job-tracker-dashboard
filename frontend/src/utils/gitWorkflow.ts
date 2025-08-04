export type GitActivity = {
  branchesCreated: number;
  pullRequests: number;
  mergeConflictsResolved: number;
  lastActivity: string;
};

export const logGitActivity = (
  branchesCreated: 3,
  pullRequests: 5,
  mergeConflictsResolved: 2
): GitActivity => {
  return {
    branchesCreated,
    pullRequests,
    mergeConflictsResolved,
    lastActivity: new Date().toISOString(),
  };
};
