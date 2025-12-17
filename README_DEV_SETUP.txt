Dev quickstart:
- Node 20+
- pnpm i
- pnpm build
- pnpm -r test

Mapper CLI:
- pnpm --filter @realify/mapper build
- node packages/mapper/dist/cli.js --in packages/mapper/test/samples/sample.svg --out /tmp/elements.json

Vectorizer CLI:
- pnpm --filter @realify/vectorizer build
- node packages/vectorizer/dist/cli.js --in packages/mapper/test/samples/sample.svg --out /tmp/clean.svg
