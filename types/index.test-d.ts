import { expectType, expectError } from "tsd"
import { t } from "testcafe"
import percySnapshot from "."

expectError(percySnapshot(t))

expectType<Promise<void>>(percySnapshot(t, "Snapshot name"))
expectType<Promise<void>>(percySnapshot(t, "Snapshot name", { widths: [1000] }))

expectError(percySnapshot(t, "Snapshot name", { foo: "bar" }))
