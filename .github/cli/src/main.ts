// https://github.com/actions/toolkit
// https://octokit.github.io/rest.js/v19
// https://github.com/octokit/app-permissions/blob/main/generated/api.github.com.json
import * as core from "@actions/core";
import fs from "node:fs";
import { CLI } from "brocolito";
import { getChangedFiles, printFileTree } from "./files";

// for local usage you want to set some ENV variables that are natively available in GitHub workflows
// e.g.
/*
# github.context.repo.owner/github.context.repo.repo
GITHUB_REPOSITORY=fdc-viktor-luft/brocolito
GITHUB_TOKEN=ghp_***
# github.context.eventName (e.g. "pull_request" or "push")
GITHUB_EVENT_NAME=pull_request
# the herein JSON file will be parsed and attached to "github.context.payload"
# Leave empty and "github.context.payload" will be an empty object
GITHUB_EVENT_PATH=<path_to_json_file>
*/
fs.existsSync(".env.local") && process.loadEnvFile(".env.local");

CLI.command("changed_files", "list changed files on GitHub workflows")
  .option(
    "--base-sha <string>",
    "Choose a base SHA to compare with (e.g. 41a6ef03). Will be ignored if PR number exists.",
  )
  .action(async ({ baseSha }) => {
    const changedFiles = await getChangedFiles(baseSha);

    // useful for debugging purpose
    printFileTree(changedFiles);
    core.setOutput("changed_files", changedFiles);
  });

CLI.command("hello", "test description")
  .option("--name <string>", "name to greet")
  .action(({ name = "world" }) => console.log(`hello ${name}`));

CLI.parse();
