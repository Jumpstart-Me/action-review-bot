const core = require("@actions/core");
const github = require("@actions/github");

const token = core.getInput("github-token", { required: true });
const developBranch = core.getInput("develop");
const qaBranch = core.getInput("qa");
const mainBranch = core.getInput("main");
const client = new github.getOctokit(token);

const approveSrcTarget = {
  [developBranch]: qaBranch,
  [qaBranch]: mainBranch,
}

async function run() {
  try {
    const pr =  github.context.payload.pull_request;
    const action = github.context.payload.action;
    const prSrc = pr.head.ref;
    const prTarget = pr.base.ref;
    const owner = github.context.repo.owner;
    const repo = github.context.repo.repo;
    const title = pr.title;
    const pull_number = github.context.payload.pull_request.number;

    core.info(`Pull Request src: "${prSrc}", target: "${prTarget}"`);

    if (prSrc in approveSrcTarget && approveSrcTarget[prSrc] == prTarget) {
      client.pulls.createReview({
        owner,
        repo,
        pull_number: pull_number,
        body: 'Looks good to me :shipit:',
        event: 'APPROVE',
      })
    } else if (title.startsWith("Deploy: release v" && prTarget == developBranch)) {
      client.pulls.createReview({
        owner,
        repo,
        pull_number: pull_number,
        body: 'Looks good to me :shipit:',
        event: 'APPROVE',
      })
    } else if (action == 'opened') {
      client.pulls.createReview({
        owner,
        repo,
        pull_number: pull_number,
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
