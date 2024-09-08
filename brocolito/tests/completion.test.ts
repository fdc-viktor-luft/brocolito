import { describe, it, expect, beforeEach } from "vitest";
import { _completion } from "../src/completion/completion";
import { State } from "../src/state";
import { CLI } from "../src/brocolito";

const anyCallback: any = () => undefined;
const dummyDescription = "dummyDescription";

const getTabEnv = (line: string): any => {
  const prev = line.split(" ").at(-2) || "";
  return { prev, line };
};

describe("completion", () => {
  beforeEach(() => {
    State.commands = {};
  });

  it("top-level completion", async () => {
    // empty commands
    expect(await _completion(getTabEnv("cli "))).toEqual(["--help"]);

    // some commands
    CLI.command("test", "test cmd here");
    CLI.command("other-command", "other cmd here");

    expect(await _completion(getTabEnv("cli "))).toEqual([
      { name: "test", description: "test cmd here" },
      { name: "other-command", description: "other cmd here" },
      "--help",
    ]);
  });

  it("started option", async () => {
    const expectedCompletedFlags = [
      { name: "--flag", description: dummyDescription },
      { name: "--file", description: "some file" },
      { name: "--str", description: "some string" },
      { name: "--union", description: "some mandatory union" },
      { name: "--inf", description: "some infinite string" },
    ];
    State.commands = {};
    CLI.command("test", dummyDescription)
      .option("--flag", dummyDescription)
      .option("--file <file>", "some file")
      .option("--str <string>", "some string")
      .option("--union! <one|two>", "some mandatory union")
      .option("--inf <string...>", "some infinite string");

    // lists all until there is a space after the flad name
    expect(await _completion(getTabEnv("cli test --flag"))).toEqual(
      expectedCompletedFlags,
    );
    expect(await _completion(getTabEnv("cli test --flag "))).toEqual(
      expectedCompletedFlags.toSpliced(0, 1),
    );
    expect(await _completion(getTabEnv("cli test --union one "))).toEqual(
      expectedCompletedFlags.toSpliced(3, 1),
    );
    // flag doesn't stop being suggested
    expect(await _completion(getTabEnv("cli test --inf whatever "))).toEqual(
      expectedCompletedFlags,
    );
    expect(await _completion(getTabEnv("cli test --file "))).toEqual([
      "__files__",
    ]);
    expect(await _completion(getTabEnv("cli test --union "))).toEqual([
      "one",
      "two",
    ]);
    expect(await _completion(getTabEnv("cli test --str "))).toEqual([]);
  });

  it("filling args", async () => {
    CLI.command("test", dummyDescription)
      .arg("<arg1:file>", dummyDescription)
      .arg("<arg2:one|two>", dummyDescription)
      .arg("<arg3>", dummyDescription)
      .option("--flag", "some flag");

    expect(await _completion(getTabEnv("cli test"))).toEqual([
      {
        description: "dummyDescription",
        name: "test",
      },
      "--help",
    ]);
    expect(await _completion(getTabEnv("cli test "))).toEqual(["__files__"]);
    expect(await _completion(getTabEnv("cli test foo"))).toEqual(["__files__"]); // still returning files to navigate the file tree
    expect(await _completion(getTabEnv("cli test foo "))).toEqual([
      "one",
      "two",
    ]);
    expect(await _completion(getTabEnv("cli test foo bar"))).toEqual([
      "one",
      "two",
    ]); // still auto-completing the arg itself
    expect(await _completion(getTabEnv("cli test foo bar "))).toEqual([]);
    expect(await _completion(getTabEnv("cli test foo bar next"))).toEqual([]); // still auto-completing the arg itself
    expect(await _completion(getTabEnv("cli test foo bar next "))).toEqual([
      { name: "--flag", description: "some flag" },
    ]);
  });

  it("filling infinite union args", async () => {
    const opts = ["one", "two", "three"];
    CLI.command("test", dummyDescription)
      .arg("<arg1:one|two|three...>", dummyDescription)
      .option("--flag", "some flag");

    expect(await _completion(getTabEnv("cli test "))).toEqual(opts);
    expect(await _completion(getTabEnv("cli test foo"))).toEqual(opts);
    expect(await _completion(getTabEnv("cli test foo "))).toEqual(opts);
    expect(await _completion(getTabEnv("cli test foo bar "))).toEqual(opts);
  });

  it("filling subcommands and options", async () => {
    CLI.command("test", { description: dummyDescription, alias: "t" })
      .option("--flag", "some flag")
      .subcommand("one", { description: "sub cmd one", alias: "o" }, (s) =>
        s.option("--more", "more stuff").action(anyCallback),
      )
      .option("--other-flag", "some other flag")
      .subcommand("two", "sub cmd two", (s) => s.action(anyCallback));

    expect(await _completion(getTabEnv("cli test "))).toEqual([
      { name: "one", description: "sub cmd one" },
      { name: "two", description: "sub cmd two" },
      { name: "--flag", description: "some flag" },
      { name: "--other-flag", description: "some other flag" },
    ]);
    expect(await _completion(getTabEnv("cli t "))).toEqual([
      { name: "one", description: "sub cmd one" },
      { name: "two", description: "sub cmd two" },
      { name: "--flag", description: "some flag" },
      { name: "--other-flag", description: "some other flag" },
    ]);
    // stops suggesting subcommands when using options in between
    expect(await _completion(getTabEnv("cli t --flag "))).toEqual([
      { name: "--other-flag", description: "some other flag" },
    ]);
    expect(await _completion(getTabEnv("cli test o "))).toEqual([
      { name: "--flag", description: "some flag" },
      { name: "--more", description: "more stuff" },
    ]);
    // does show all subcommands as long as there was no space entered
    expect(await _completion(getTabEnv("cli test two"))).toEqual([
      { name: "one", description: "sub cmd one" },
      { name: "two", description: "sub cmd two" },
      { name: "--flag", description: "some flag" },
      { name: "--other-flag", description: "some other flag" },
    ]);
    expect(await _completion(getTabEnv("cli test two "))).toEqual([
      { name: "--flag", description: "some flag" },
      { name: "--other-flag", description: "some other flag" },
    ]);
    // we prevent that subcommands can be used after options have been declared
    expect(await _completion(getTabEnv("cli test --flag "))).toEqual([
      { name: "--other-flag", description: "some other flag" },
    ]);
    expect(await _completion(getTabEnv("cli t o --flag "))).toEqual([
      { name: "--more", description: "more stuff" },
    ]);
  });
});
