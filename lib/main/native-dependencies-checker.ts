import { NativeDependencies } from "../common/native/native-dependency";
import { RethrownError } from "../common/rethrown-error";

export class NativeDependenciesChecker {
    private constructor() { }

    static async check() {
        try {
            const requiredVersions = await NativeDependencies.getRequiredVersions();
            if (!await NativeDependencies.isInstalled(requiredVersions))
                await NativeDependencies.install(requiredVersions);
        }
        catch (e) {
            throw new RethrownError('An unexpected error occurred while checking native dependencies', e);
        }
    }
}