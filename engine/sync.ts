// import { ObjectId } from "mongodb";
import parse, { SyncLine, SyncPrimitive, Syncs } from "./parser.ts";

// deno-lint-ignore ban-types
type ActionMap = Record<string, Function>;
// Trace of action that has been executed and contains return value
type ExecutedActionTrace = [string, unknown[], unknown];
type Bindings = Record<symbol, unknown>;

export default class SyncConcept {
  public readonly actionMap: ActionMap;
  public readonly syncs: Syncs;
  result: unknown;
  constructor(
    public readonly concepts: Array<unknown>,
    syncInput: string,
  ) {
    // Map actions of concepts
    const concept_syncs = this.mapActions(concepts);
    // Synchronize on self to enable synchronization with syncs
    const self_syncs = this.mapActions([this]);
    this.actionMap = { ...concept_syncs, ...self_syncs };
    this.syncs = parse(syncInput);
    // console.dir(this.actionMap, { depth: null });
  }
  // Map actions from concept names to the actual methods
  // TODO: hide private methods, or find a way to properly scan only for concept actions
  private mapActions(concepts: Array<unknown>) {
    return Object.fromEntries(
      concepts.flatMap((concept) => {
        const fullConceptName = Object.getPrototypeOf(concept).constructor.name;
        // Assuming a naming pattern of "Concept" at the end, should probably revisit this convention
        const conceptName = fullConceptName.slice(0, -"Concept".length);
        const propertyNames = Object.getOwnPropertyNames(
          Object.getPrototypeOf(concept),
        );
        return propertyNames
          .filter((propertyName) => propertyName != "constructor")
          .map((propertyName) => {
            // Typescript having trouble with dynamic property name lookup on unknown concepts
            return [
              conceptName + "." + propertyName,
              // deno-lint-ignore no-explicit-any
              (concept as any)[propertyName].bind(concept),
            ];
          });
      }),
    );
  }
  // Match action arguments to bindings, create new if binding is free
  private matchTerms(
    actionArg: unknown,
    syncArg: SyncPrimitive,
    bindings: Bindings,
  ) {
    if (typeof syncArg === "symbol") {
      if (syncArg in bindings) {
        // TODO: Remove hack for MongoDB ObjectID comparisons
        // const boundSyncArg = bindings[syncArg];
        // if (actionArg instanceof ObjectId && boundSyncArg instanceof ObjectId) {
        //   return actionArg.equals(boundSyncArg);
        // }
        return actionArg === bindings[syncArg];
      }
      // Unbound symbol, so we bind
      bindings[syncArg] = actionArg;
      return true;
    }
    return actionArg === syncArg;
  }
  // Match an action trace to a SyncLine, including multiple return bindings
  private matchTrace(
    [action, actionArgs, result]: ExecutedActionTrace,
    [syncAction, syncArgs, syncResult]: SyncLine,
    bindings: Bindings,
  ) {
    // console.dir(["action: ", [action, actionArgs, result]], { depth: null });
    // // console.dir(["action: ", [action, undefined, result]], { depth: null });
    // console.dir(["sync: ", [syncAction, syncArgs, syncResult]], {
    //   depth: null,
    // });
    // console.dir(["bindings: ", bindings], { depth: null });
    if (action !== syncAction) {
      throw Error("Actions do not match");
    }
    actionArgs.forEach((arg, i) => {
      if (!this.matchTerms(arg, syncArgs[i], bindings)) {
        throw Error("Argument does not match");
      }
    });
    if (syncArgs.length > actionArgs.length) {
      throw Error("Sync argument length is longer");
    }
    // Match if return bindings exist
    if (syncResult !== null) {
      // Check and match for single return binding
      if (syncResult.length === 1) {
        // console.log("matching single return: ");
        if (!this.matchTerms(result, syncResult[0], bindings)) {
          throw Error("Return binding does not match function return");
        }
      } // Check for multiple returns
      else if (syncResult.length > 1) {
        if (!Array.isArray(result)) {
          throw Error("Multiple bindings found for singular return");
        }
        if (result.length !== syncResult.length) {
          throw Error(
            "Function returns differing number of values from specified return bindings",
          );
        }
        syncResult.forEach((ret, i) => {
          if (!this.matchTerms(result[i], ret, bindings)) {
            throw Error("Return value does not match");
          }
        });
      }
    }
  }
  // Invoker with meta-invoke functionality
  private async invoke(action: string, actionArgs: unknown[]) {
    // console.log("invoked", action);
    // console.dir(actionArgs, { depth: null });
    if (action === "Sync.invoke") {
      const [true_action, before, args] = actionArgs;
      const full_args = [before, ...(args as unknown[])];
      const [after, result] = await this.actionMap[true_action as string](
        ...full_args,
      );
      let fixed_result = undefined;
      if (result !== undefined) {
        fixed_result = JSON.parse(JSON.stringify(result));
      }
      // console.log("invoking with");
      // console.dir([true_action, args, result], { depth: null });
      this.result = fixed_result;
      return [after, result];
    } else if (action === "Sync.execute") {
      const [true_action, args] = actionArgs;
      const result = await this.actionMap[true_action as string](
        ...(args as unknown[]),
      );
      this.result = result;
    } else {
      return await this.actionMap[action](...actionArgs);
    }
  }
  // Run function that can be synchronized against
  private async metaRun(action: string, actionArgs: unknown[]) {
    // Clear result
    const metaInvoke = this.invoke.bind(this);
    this.result = undefined;
    const args = [action, actionArgs];
    const trace: ExecutedActionTrace = ["Sync.run", args, null];
    let traces = [trace];
    traces = traces.concat(await this.syncTrace(trace, metaInvoke));
    let i = 1;
    while (traces.length > i) {
      const nextTraces = await this.syncTrace(
        traces[i],
        metaInvoke,
      );
      if (nextTraces.length > 0) {
        traces = traces.concat(nextTraces);
      }
      i++;
    }
    // console.log("Meta execution:");
    // console.dir(traces.map((trace) => trace[0]), { depth: null });
    // console.log("this.result", this.result);
    return this.result;
  }
  // Given that an action has already run with a trace, find and execute the next set
  private async syncTrace(
    trace: ExecutedActionTrace,
    invoker: Function,
  ): Promise<ExecutedActionTrace[]> {
    const action = trace[0];
    // console.log("Syncing single trace: ", trace);
    // console.dir(invoker, { depth: null });
    if (!(action in this.syncs)) {
      return [];
    }
    const blocksToCheck = this.syncs[action];
    let executedTraces: ExecutedActionTrace[] = [];
    // Check each full synchronization block
    for (const block of blocksToCheck) {
      const [whenBlock, syncBlock] = block;
      // Prepare a fresh set of speculative traces and bindings
      const localTraces: ExecutedActionTrace[] = [];
      const bindings: Bindings = {};
      // Helper to lookup bound arguments in subsequent traces
      const lookupArguments = (arg: unknown) => {
        if (typeof arg == "symbol") {
          if (arg in bindings) {
            return bindings[arg];
          } else {
            throw Error("Unbound argument");
          }
        }
        return arg;
      };
      // Helper to execute a SyncLine and match
      const runAndMatchLine = async (line: SyncLine, invoker: Function) => {
        const [nextAction, nextArgs] = line;
        const boundArgs = nextArgs.map(lookupArguments);
        // Run next action
        // const result = await this.actionMap[nextAction](...boundArgs);
        const result = await invoker(nextAction, boundArgs);
        const newTrace: ExecutedActionTrace = [nextAction, boundArgs, result];
        this.matchTrace(newTrace, line, bindings);
        localTraces.push(newTrace);
      };
      // Match on when block
      try {
        const firstWhen = whenBlock[0];
        const restWhen = whenBlock.slice(1);
        this.matchTrace(trace, firstWhen, bindings);
        for (const line of restWhen) {
          await runAndMatchLine(line, invoker);
        }
      } catch (error) {
        // During when block no need to throw error
        // console.log("When clause failed to match due to: ", error);
        continue;
      }
      // Match on sync block if we haven't exited yet
      for (const line of syncBlock) {
        await runAndMatchLine(line, invoker);
      }
      // A full successful match means we append the history
      executedTraces = executedTraces.concat(localTraces);
    }

    return executedTraces;
  }
  public async run(action: string, actionArgs: unknown[]) {
    // Run once and return the result of the first action
    const metaRun = this.metaRun.bind(this);
    const result = await metaRun(action, actionArgs);
    const trace: ExecutedActionTrace = [action, actionArgs, result];
    let traces = [trace];
    traces = traces.concat(await this.syncTrace(trace, metaRun));
    let i = 1;
    while (traces.length > i) {
      const nextTraces = await this.syncTrace(traces[i], metaRun);
      if (nextTraces.length > 0) {
        traces = traces.concat(nextTraces);
      }
      i++;
    }
    console.log("Execution history:");
    console.dir(traces, { depth: null });
    return result;
  }
}
