const main = {
  id: process.env.NEON_ID,
  projectId: process.env.NEON_PROJECT_ID,
};

const createNewBranch = (appStage: string) =>
  new neon.Branch("database-branch", {
    projectId: main.projectId,
    parentId: main.id,
    name: `branch-${appStage}-${Date.now()}`,
  });

createNewBranch($app.stage);

export default new sst.Linkable("db", {
  properties: {
    database: "neondb",
  },
});
