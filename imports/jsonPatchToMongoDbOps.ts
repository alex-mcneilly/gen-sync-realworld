// @ts-nocheck External import
// deno-lint-ignore-file
// https://github.com/fathomas/json-patch-to-mongodb-ops/tree/main
import type { Operation } from "npm:fast-json-patch";
import { Collection } from "npm:mongodb";

export const jsonPatchPathToDot = (path) =>
    path
        .replace(/^\//, "")
        .replace(/\//g, ".")
        .replace(/~1/g, "/")
        .replace(/~0/g, "~");

function getTrailingPos(path: string): number {
    const parts = path.split(".");
    const pathTail = parts.slice(-1)[0];
    return parts.length > 1
        ? pathTail === "-" ? -1 : parseInt(pathTail, 10)
        : NaN;
}

function $remove(path: any) {
    const result: any[] = [];
    const trailingPos = getTrailingPos(path);
    result.push({ $unset: { [path]: 1 } });
    if (!Number.isNaN(trailingPos)) {
        const pathHead = path.split(".").slice(0, -1).join(".");
        result.push({ $pull: { [pathHead]: null } });
    }
    return result;
}

function $add(path: any, value) {
    const trailingPos = getTrailingPos(path);
    if (Number.isNaN(trailingPos)) {
        return { $set: { [path]: value } };
    }
    const pathHead = path.split(".").slice(0, -1).join(".");
    return {
        $push: {
            [pathHead]: trailingPos >= 0
                ? { $each: [value], $position: trailingPos }
                : value,
        },
    };
}

export async function jsonPatchToMongoDbOps(
    patch: Operation[],
    targetFilter: Record<string, any>,
    collection: Collection,
) {
    // const error = validate(patch);
    // if (error) {
    //     throw error;
    // }
    return (
        await Promise.all(
            patch.map(async (operation) => {
                const path = jsonPatchPathToDot(operation.path);
                if (path === "") {
                    console.log("empty path");
                } else if (!path || path.endsWith(".")) {
                    throw new Error("Invalid update path.");
                }
                switch (operation.op) {
                    case "add": {
                        return $add(path, operation.value);
                    }
                    case "remove": {
                        return $remove(path);
                    }
                    case "replace": {
                        return { $set: { [path]: operation.value } };
                    }
                    case "copy":
                    case "move": {
                        const from = jsonPatchPathToDot(operation.from);
                        const fromParts = from.split(".");
                        const targetIndex =
                            fromParts[1] && /^\d+$/.test(fromParts[1])
                                ? parseInt(fromParts[1])
                                : NaN;

                        const currDoc = await collection.findOne(targetFilter, {
                            // Reduce memory usage and speed up query.
                            projection: {
                                _id: 0,
                                ...(Number.isNaN(targetIndex)
                                    ? {
                                        [fromParts[0]]: 1,
                                    }
                                    : {
                                        [fromParts[0]]: {
                                            $slice: [targetIndex, 1],
                                        },
                                    }),
                            },
                        });

                        let segmentsToWalk, startPoint;
                        if (Number.isNaN(targetIndex)) {
                            segmentsToWalk = fromParts;
                            startPoint = currDoc;
                        } else {
                            segmentsToWalk = fromParts.slice(2);
                            startPoint = currDoc[fromParts[0]][0];
                        }

                        const valueToTransfer = segmentsToWalk.reduce(
                            (curr, propName) => curr[propName],
                            startPoint,
                        );
                        if (typeof valueToTransfer === "undefined") {
                            throw new Error("Can't move undefined value!");
                        }

                        const addOp = $add(path, valueToTransfer);
                        return operation.op === "copy"
                            ? addOp
                            : [...$remove(from), addOp];
                    }
                    case "test": {
                        break;
                    }
                    default: {
                        throw new Error(
                            "Unsupported Operation! op = " + operation.op,
                        );
                    }
                }
            }),
        )
    )
        .flat()
        .filter((update) => update)
        .map((update) => ({ updateOne: { update, filter: targetFilter } }));
}
