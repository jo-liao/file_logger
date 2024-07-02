import moment from 'moment';

let isInitialized = false;
let keepingFileCount: number;
let isLoggingToConsole: boolean;
let bufferSize: number;
export const buffer: Array<string> = [];

let createFile: (filename: string) => Promise<void>;
let removeFile: (filename: string) => Promise<void>;
let writeFile: (filename: string, text: string) => Promise<void>;
let getFilenames: () => Promise<Array<string>>;

type Config = {
    bufferSize: number;
    keepingFileCount: number;
    isLoggingToConsole?: boolean;
    createFile: (filename: string) => Promise<void>;
    removeFile: (filename: string) => Promise<void>;
    writeFile: (filename: string, text: string) => Promise<void>;
    getFilenames: () => Promise<Array<string>>;
};
export async function initialize(config: Config): Promise<void> {
    await config.createFile('test.log');
    await config.writeFile('test.log', 'message');
    await config.removeFile('test.log');
    await config.getFilenames();

    isInitialized = true;
    bufferSize = config.bufferSize;
    keepingFileCount = config.keepingFileCount;
    isLoggingToConsole = config.isLoggingToConsole ?? false;
    createFile = config.createFile;
    removeFile = config.removeFile;
    getFilenames = config.getFilenames;
    writeFile = config.writeFile;
}
export function close(): void {
    isInitialized = false;
}

export class LoggerError extends Error {
    constructor(message) {
        super(message);
        this.name = 'LoggerError';
    }
}

export async function error(message: string): Promise<void> {
    if (!isInitialized) {
        throw new LoggerError(`[FileLogger] please initialize first.`);
    }

    if (isLoggingToConsole) {
        // eslint-disable-next-line no-console
        console.error(`[FileLogger]${message}`);
    }

    const filename = 'error.log';
    const isoTime = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ');
    try {
        await createFile(filename);
        await writeFile(filename, `[${isoTime}]${message}\n`);
    } catch (e) {
        throw new LoggerError(`Failed to write the error into file. | error: ${e}`);
    }
}

export async function getLogFilenames(): Promise<Array<string>> {
    if (!isInitialized) {
        throw new LoggerError(`Please initialize first.`);
    }

    const filenames = await getFilenames();
    return filenames.filter((filename) => filename.match(/\d{8}T\d{6}.log/)).sort();
}
export async function rollback(count: number): Promise<void> {
    if (!isInitialized) {
        throw new LoggerError(`Please initialize first.`);
    }
    if (count <= 0) {
        return;
    }

    const filenames = await getLogFilenames();
    filenames.slice(0, count).forEach((filename) => removeFile(filename));
}
export async function flush(retryTimes = 3): Promise<void> {
    if (!isInitialized) {
        throw new LoggerError(`[FileLogger] please initialize first.`);
    }

    if (retryTimes >= 0) {
        try {
            const filename = `${moment().format('YYYYMMDDTHHmmss')}.log`;
            await createFile(filename);
            await writeFile(filename, buffer.join('\n'));
            buffer.length = 0;
        } catch (e) {
            await rollback(1);
            await flush(retryTimes - 1);
        }

        const filenames = await getLogFilenames();
        await rollback(filenames.length - keepingFileCount);
    } else {
        throw new LoggerError(`Failed to flush the messages into file.`);
    }
}
export async function log(message: string): Promise<void> {
    if (!isInitialized) {
        throw new LoggerError(`Please initialize first.`);
    }

    if (isLoggingToConsole) {
        // eslint-disable-next-line no-console
        console.log(`[FileLogger]${message}`);
    }

    const isoTime = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ');
    buffer.push(`[${isoTime}]${message}`);
    if (buffer.length > bufferSize) {
        await flush();
    }
}
