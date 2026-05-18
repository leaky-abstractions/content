import { defineCommand } from 'citty';
import consola from 'consola';
import { validateContent } from '../lib/validate';

export default defineCommand({
    meta: {
        name: 'validate',
        description: 'Validate all content against schemas',
    },
    async run() {
        const result = await validateContent({ cwd: process.cwd() });
        if (!result.ok) {
            consola.error(`Validation failed (${result.errors.length} error${result.errors.length === 1 ? '' : 's'}):`);
            for (const err of result.errors) {
                consola.error(`  ${err}`);
            }
            process.exit(1);
        }
        consola.success('All content validated successfully.');
    },
});
