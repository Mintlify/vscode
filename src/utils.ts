import * as vscode from 'vscode';

export type File = {
	path: string;
	filename: string;
	content: string;
};

export const REQUEST_ACCESS_URI = 'https://mintlify.com/start-minting';

export const SIGN_IN_BUTTON = 'Sign in';
export const REQUEST_ACCESS_BUTTON = 'Request access';
export const LOGOUT_BUTTON = 'Logout';

const traverseFiles = async (root: vscode.Uri, filesContent: File[]): Promise<File[]> => {
	const files = await vscode.workspace.fs.readDirectory(root);
	const filePromises = files.map(async (file, i) => {
		// If filetype is a file
		if (file[1] === 1) {
			const filePath = `${root}/${file[0]}`;
			const readFileUri = vscode.Uri.parse(filePath);
			const readFileRaw = await vscode.workspace.fs.readFile(readFileUri);
			const readFileContent = { path: filePath, filename: file[0], content: readFileRaw.toString()};
			filesContent.push(readFileContent);
		} else if (file[1] === 2 && isTraversablePath(file[0])) {
			const newRoot = vscode.Uri.parse(`${root}/${file[0]}`);
			await traverseFiles(newRoot, filesContent);
		}

	});
	await Promise.all(filePromises);
	return filesContent;
};

const isTraversablePath = (folderName: string): boolean => {
	const nonTraversable: Record<string, boolean> = {
		"node_modules": true,
		".git": true,
		"build": true,
	};

	return !nonTraversable[folderName];
};

export const ENTIRE_WORKSPACE_OPTION = 'Search entire workspace';
export const THIS_FILE_OPTION = 'Search this file';

export const getFiles = async (option: string): Promise<File[]> => {
	if (option === ENTIRE_WORKSPACE_OPTION) {
		const root = vscode.workspace.workspaceFolders![0].uri;
		const files = await traverseFiles(root, []);
		return files;
	}

	else if (option === THIS_FILE_OPTION) {
		const document = vscode.window.activeTextEditor?.document;
		if (document === undefined) {
			return [];
		}

		const { fileName } = document;
		const fileNamePath = fileName.split('/');

		const file = {
			path: document.uri.toString(),
			filename: fileNamePath[fileNamePath.length - 1],
			content: document.getText(),
		};
		return [file];
	}

	return [];
};

export const getOptionShort = (option: string): string => {
	switch (option) {
		case ENTIRE_WORKSPACE_OPTION:
			return 'the workspace';
		case THIS_FILE_OPTION:
			return 'this file';
		default:
			return '';
	}
};