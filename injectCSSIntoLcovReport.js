import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let css_file_path = '';

// Parse command-line arguments
const argv = yargs(hideBin(process.argv)).option('css-path', {
	alias: 'c',
	type: 'string',
	description: 'Path to your custom CSS file'
}).argv;

// If a custom CSS file path is provided, use it instead
if (argv['css-path']) {
	css_file_path = join(__dirname, argv['css-path']);
} else {
	console.log('Using default CSS file path');
	// Set default css file path to the one provided by this package
	css_file_path = join(__dirname, 'node_modules/jest-coverage-dark-mode/dark-mode.css');
}

// Read the CSS file
let css_content = '';
try {
	css_content = readFileSync(css_file_path, 'utf8');
} catch (error) {
	console.error(
		`Could not read the file ${css_file_path}. Please provide a valid custom CSS file path using the --css-path option.`
	);
	process.exit(1);
}

/**
 * Injects CSS into all lcov report directories generated by Jest.
 * @param {string} root_dir the root directory to start the search.
 * @returns {void} nothing
 */
function injectCSSIntoLcovReport(root_dir) {
	let success = false;
	const dirs_to_process = [root_dir];

	// Traverse the directory tree to find all lcov-report directories
	while (dirs_to_process.length > 0) {
		const current_dir = dirs_to_process.pop();
		const entries = readdirSync(current_dir, { withFileTypes: true });

		// Process each entry in the current directory
		for (const entry of entries) {
			const entry_path = join(current_dir, entry.name);

			// If the entry is a directory, check if it is an lcov-report directory
			if (entry.isDirectory()) {
				// If the entry is an lcov-report directory, inject the CSS
				if (entry.name === 'lcov-report') {
					const prettify_css_path = join(entry_path, 'prettify.css');
					console.log(`Injecting CSS into ${prettify_css_path}`);
					writeFileSync(prettify_css_path, css_content, 'utf-8');
					success = true;
					// Otherwise, add the directory to the list of directories to process
				} else {
					dirs_to_process.push(entry_path);
				}
			}
		}
	}

	// If no lcov-report directories were found, log a message and return
	if (!success) {
		console.log('No lcov-report directories found.');
		return;
	}

	// Otherwise, the lcov-report directories were found and the CSS was injected successfully
	console.log('CSS injected successfully.');
}

// Get the root directory of where the script is being run and inject the CSS
const root_dir = process.cwd();
injectCSSIntoLcovReport(root_dir);
