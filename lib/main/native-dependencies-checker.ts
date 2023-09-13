import { NativeDependencies } from "../common/native/native-dependency";
import { RethrownError } from "../common/rethrown-error";

export class NativeDependenciesChecker {
    private constructor() { }

    static async check() {
        try {
            if (!await NativeDependencies.isInstalled(NativeDependencies.defaultVersions))
                await NativeDependencies.install(NativeDependencies.defaultVersions);
        }
        catch (e) {
            throw new RethrownError('An unexpected error occurred while checking native dependencies', e);
        }
    }
}