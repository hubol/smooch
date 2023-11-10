<!-- npm skip -->
![smooch](./.github/assets/smooch.svg)
<!-- npm skip end -->

Opinionated asset transformer and aggregator.

----------------

When creating computer games, certain assets need to be destructively transformed in order for the game engine to consume them. For example; textures must be packed into texture atlases, and sound files need to be converted to formats digestible by modern browsers. **smooch** supports transforming directories of assets based on configuration.

In addition, it is much more pleasurable to work in environments with a type system. To this end, **smooch** supports generating code files from asset files using configurable template programs.

## Usage

<!-- smooch commands -->
`smooch`

Start in watch mode. Aggregates and transforms assets as file changes are detected.
Probably should be used while developing!

`smooch init`

Initialize a **smooch.json** configuration file.

`smooch copy-program <program> <dst>`

Copy a default template JavaScript program **program** to **dst**. Available programs are
- texture-pack
- json-aggregate
- audio-convert

`smooch build`

Aggregate and transform assets according to your **smooch.json**. Probably should be used on a CI server!

`smooch init-native-deps`

Produce a **smooch-native-deps.json** configuration file.
This is for a bizarre subsystem that sidesteps your **package-lock.json**.
You probably won't need to touch this!

`smooch help`

List these commands!
<!-- smooch commands end -->

## Design goals

- Not slow
- Simple installation
- Zero dependencies
- Informative console output
- Watches directories
- Recovers gracefully from IO errors
- Supports configurable templates
- Keeps a cache for faster start-up
- Build tool agnostic
- Config file with schema