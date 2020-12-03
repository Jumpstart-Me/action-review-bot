const core = require("@actions/core"),
  github = require("@actions/github");

const token = core.getInput("github-token", { required: true }),
  developBranch = core.getInput("develop"),
  qaBranch = core.getInput("qa"),
  mainBranch = core.getInput("main"),
  client = new github.getOctokit(token);

const approveSrcTarget = {
  [developBranch]: qaBranch,
  [qaBranch]: mainBranch,
}

async function run() {
  try {
    const pr =  github.context.payload.pull_request,
      action = github.context.payload.action,
      prSrc = pr.head.ref,
      prTarget = pr.base.ref;
      owner = github.context.repo.owner,
      repo = github.context.repo.repo;

    core.info(`Pull Request src: "${prSrc}", target: "${prTarget}"`);

    if (prSrc in approveSrcTarget && approveSrcTarget[prSrc] == prTarget) {
      client.pulls.createReview({
        owner,
        repo,
        pull_number: github.context.payload.pull_request.number,
        body: 'Looks good to me :shipit:',
        event: 'APPROVE',
      })
    } else if (action == 'opened') {
      client.pulls.createReview({
        owner,
        repo,
        pull_number: github.context.payload.pull_request.number,
        body: `I can't automatically approve changes from "${prSrc}" to "${prTarget}. A human will have to review this. :robot:`,
        event: 'COMMENT',
      })
    }
  } catch (err) {
    //Even if it's a valid situation, we want to fail the action in order to be able to find the issue and fix it.
    core.setFailed(err.message);
    core.debug(JSON.stringify(err));
  }
}

run();
