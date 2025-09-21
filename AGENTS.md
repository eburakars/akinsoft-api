# Repository Guidelines

## Project Structure & Module Organization
- `pom.xml` defines Maven dependencies, Java 17 compilation, and WAR packaging; update it when adding connectors or plugins.
- `src/main/java/App.java` boots SparkJava routes by instantiating handlers in `API/` and sharing the `Utils.Connector` instance; new endpoints should fit this wiring.
- `src/main/java/API/` houses request handlers; keep data access close to the handler and shared helpers in `src/main/java/Utils/`.
- `src/test/java/` mirrors production namespaces with JUnit fixtures and JSON assertions, while `src/test/resources/` stores the SQLite `mock.db` snapshot and expected payloads.
- `target/` is Maven’s build output; never commit its contents.

## Build, Test, and Development Commands
- `mvn clean install` resolves dependencies, compiles the WAR, and runs the full test suite.
- `mvn test` is the quickest way to rerun unit tests against the temporary SQLite database.
- `mvn package` creates `target/akinsoftrestapi.war` without installing it locally.
- `mvn exec:java -Dexec.mainClass=App` starts the SparkJava server for manual verification; prefer IDE run configs during debugging.

## Coding Style & Naming Conventions
- Use four-space indentation, keep braces on the same line as declarations, and favor explicit `import` statements as in existing classes.
- Classes remain PascalCase inside `API` or `Utils` packages; methods and fields use `camelCase`, while integration tests follow the `test_*` naming seen in `TestAPI`.
- Reuse Java text blocks (`"""`) for multiline SQL and JSON, and stick to UTF-8 source encoding configured in the POM.

## Testing Guidelines
- Tests rely on JUnit 4 annotations plus JSONAssert for payload comparison; match the existing pattern of arranging expected fixtures under `src/test/resources/`.
- Set `USE_SQLITE=true` when running tests to keep the SQLite mock database; leave it unset to execute against Firebird.
- When adding database interactions, extend `TestUtils` to prepare data and ensure the `.tmp.db` cleanup in `@After` still succeeds.
- Cover new code paths with positive and failure cases, and keep JSON comparisons lenient unless strict ordering is required.

## Commit & Pull Request Guidelines
- Recent commits are short (`Initial commit`, `Yeni readme.md`, `target`); move toward concise imperative English subjects (e.g., `Add stock price endpoint`).
- Reference related issues in the body, describe database/config changes explicitly, and attach sample API requests or screenshots when behavior changes.
- Before raising a PR, run `mvn clean install`, note any skipped tests, and highlight manual verification steps for reviewers.

## Security & Configuration Tips
- Database credentials live in `Utils.Connector`; keep long-term secrets out of source control by sourcing them from environment variables or secured config files.
- Confirm Firebird access at `192.168.0.115:3050` before pointing production traffic there, and keep the SQLite mock updated whenever schema changes occur.
