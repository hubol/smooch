# smooch

Opinionated asset transformer and aggregator.

When creating computer games, certain assets need to be destructively transformed in order for the game engine to consume them. For example; textures must be packed into texture atlases, and sound files need to be converted to formats digestible by modern browsers. **smooch** supports transforming directories of assets based on configuration.

In addition, it is much more pleasurable to work in environments with a type system. To this end, **smooch** supports generating code files from asset files using configurable templates.

## Usage

TODO

## Design goals

- Not slow
- Small install size
- Informative console output
- Watches directories
- Recovers gracefully from IO errors
- Supports configurable templates
- Keeps a cache for faster start-up
- Build tool agnostic
- Config file with schema
