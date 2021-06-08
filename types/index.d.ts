import { SnapshotOptions } from "@percy/core"
import { t as TestCafe } from "testcafe"

export default function percySnapshot(
  t: typeof TestCafe,
  name: string,
  options?: SnapshotOptions
): Promise<void>
