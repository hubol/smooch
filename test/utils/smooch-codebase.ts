import { Path } from "../../lib/common/path";
import { TestCommands } from "./test-commands";
import { TestProcess } from "./test-process";

export const TestSmoochCodebase = {
    compile() {
        return new TestProcess(TestCommands.npm, ['run', 'build'], {});
    },
    createTarBall(destination: Path.Directory.t) {
        return new TestProcess(TestCommands.npm, ['pack', '--pack-destination', destination], {})
    }
}
