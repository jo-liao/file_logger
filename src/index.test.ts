import {
    LoggerError,
    buffer,
    close,
    error,
    flush,
    getLogFilenames,
    initialize,
    log,
    rollback,
} from '.';

beforeEach(() => {
    close();
    buffer.length = 0;
});

it('initialize', async () => {
    const createFile = jest.fn();
    const removeFile = jest.fn();
    const writeFile = jest.fn();
    const getFilenames = jest.fn();

    await initialize({
        bufferSize: 3,
        keepingFileCount: 0,
        createFile,
        removeFile,
        writeFile,
        getFilenames,
    });
    expect(createFile).toHaveBeenCalledTimes(1);
    expect(createFile).toHaveBeenCalledWith('test.log');
    expect(removeFile).toHaveBeenCalledTimes(1);
    expect(removeFile).toHaveBeenCalledWith('test.log');
    expect(writeFile).toHaveBeenCalledTimes(1);
    expect(writeFile).toHaveBeenCalledWith('test.log', 'message');
    expect(getFilenames).toHaveBeenCalledTimes(1);
});

describe('error', () => {
    it('not initialized yet', async () => {
        await expect(() => error('')).rejects.toThrow(LoggerError);
    });

    it('createFile throw an error', async () => {
        const createFile = jest.fn();
        const removeFile = jest.fn();
        const writeFile = jest.fn();
        const getFilenames = jest.fn();
        await initialize({
            bufferSize: 0,
            keepingFileCount: 0,
            createFile,
            removeFile,
            writeFile,
            getFilenames,
        });
        createFile.mockImplementation(() => {
            throw new Error('mock');
        });

        await expect(() => error('')).rejects.toThrow(LoggerError);
    });

    it('writeFile throw an error', async () => {
        const createFile = jest.fn();
        const removeFile = jest.fn();
        const writeFile = jest.fn();
        const getFilenames = jest.fn();
        await initialize({
            bufferSize: 0,
            keepingFileCount: 0,
            createFile,
            removeFile,
            writeFile,
            getFilenames,
        });
        writeFile.mockImplementation(() => {
            throw new Error('mock');
        });

        await expect(() => error('')).rejects.toThrow(LoggerError);
    });

    it('normal', async () => {
        const createFile = jest.fn();
        const removeFile = jest.fn();
        const writeFile = jest.fn();
        const getFilenames = jest.fn();
        await initialize({
            bufferSize: 0,
            keepingFileCount: 0,
            createFile,
            removeFile,
            writeFile,
            getFilenames,
        });

        await error('error1');
        expect(createFile).toHaveBeenCalledTimes(2);
        expect(createFile).toHaveBeenCalledWith('error.log');
        expect(writeFile).toHaveBeenCalledTimes(2);
        expect(writeFile).toHaveBeenCalledWith(
            'error.log',
            expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}\+\d{4}\]error1\n/),
        );
        expect(removeFile).toHaveBeenCalledTimes(1);
        expect(getFilenames).toHaveBeenCalledTimes(1);
    });
});

describe('getLogFilenames', () => {
    it('not initialized yet', async () => {
        await expect(() => getLogFilenames()).rejects.toThrow(LoggerError);
    });

    it('normal', async () => {
        const createFile = jest.fn();
        const removeFile = jest.fn();
        const writeFile = jest.fn();
        const getFilenames = jest.fn();
        getFilenames.mockReturnValue([
            'file',
            'file.txt',
            'file.log',
            '20010101T000005.log',
            '20010101T000001.log',
            '20010101T000002.log',
        ]);
        await initialize({
            bufferSize: 0,
            keepingFileCount: 1,
            createFile,
            removeFile,
            writeFile,
            getFilenames,
        });

        await expect(getLogFilenames()).resolves.toStrictEqual([
            '20010101T000001.log',
            '20010101T000002.log',
            '20010101T000005.log',
        ]);
        expect(getFilenames).toHaveBeenCalledTimes(1 + 1);
        expect(createFile).toHaveBeenCalledTimes(1);
        expect(removeFile).toHaveBeenCalledTimes(1);
        expect(writeFile).toHaveBeenCalledTimes(1);
    });
});

describe('rollback', () => {
    it('not initialized yet', async () => {
        await expect(() => rollback(0)).rejects.toThrow(LoggerError);
    });

    it('normal', async () => {
        const createFile = jest.fn();
        const removeFile = jest.fn();
        const writeFile = jest.fn();
        const getFilenames = jest.fn();
        getFilenames.mockReturnValue([
            'file',
            'file.txt',
            'file.log',
            '20010101T000005.log',
            '20010101T000002.log',
            '20010101T000001.log',
            '20010101T000003.log',
            '20010101T000004.log',
        ]);
        await initialize({
            bufferSize: 0,
            keepingFileCount: 1,
            createFile,
            removeFile,
            writeFile,
            getFilenames,
        });

        await rollback(0);
        expect(getFilenames).toHaveBeenCalledTimes(1 + 0);
        expect(removeFile).toHaveBeenCalledTimes(1 + 0);

        await rollback(1);
        expect(getFilenames).toHaveBeenCalledTimes(1 + 1);
        expect(removeFile).toHaveBeenCalledTimes(1 + 1);
        expect(removeFile).toHaveBeenCalledWith('20010101T000001.log');

        await rollback(6);
        expect(getFilenames).toHaveBeenCalledTimes(2 + 1);
        expect(removeFile).toHaveBeenCalledTimes(2 + 5);
        expect(removeFile).toHaveBeenCalledWith('20010101T000001.log');
        expect(removeFile).toHaveBeenCalledWith('20010101T000002.log');
        expect(removeFile).toHaveBeenCalledWith('20010101T000003.log');
        expect(removeFile).toHaveBeenCalledWith('20010101T000004.log');
        expect(removeFile).toHaveBeenCalledWith('20010101T000005.log');

        expect(createFile).toHaveBeenCalledTimes(1);
        expect(writeFile).toHaveBeenCalledTimes(1);
    });
});

describe('flush', () => {
    it('not initialized yet', async () => {
        await expect(() => flush()).rejects.toThrow(LoggerError);
    });

    it('retryTimes = 0', async () => {
        const createFile = jest.fn();
        const removeFile = jest.fn();
        const writeFile = jest.fn();
        const getFilenames = jest.fn();
        getFilenames.mockReturnValue([]);
        await initialize({
            bufferSize: 0,
            keepingFileCount: 0,
            createFile,
            removeFile,
            writeFile,
            getFilenames,
        });

        buffer.push('1');
        buffer.push('2');
        await flush(0);
        expect(buffer).toStrictEqual([]);
        const filenameMatching = expect.stringMatching(/\d{8}T\d{6}.log/);
        expect(createFile).toHaveBeenCalledTimes(1 + 1);
        expect(createFile).toHaveBeenCalledWith(filenameMatching);
        expect(writeFile).toHaveBeenCalledTimes(1 + 1);
        expect(writeFile).toHaveBeenCalledWith(filenameMatching, '1\n2');
        expect(getFilenames).toHaveBeenCalledTimes(1 + 1);
        expect(removeFile).toHaveBeenCalledTimes(1);
    });

    it('retryTimes = 0, and rollback', async () => {
        const createFile = jest.fn();
        const removeFile = jest.fn();
        const writeFile = jest.fn();
        const getFilenames = jest.fn();
        getFilenames.mockReturnValue(['20010101T000001.log', '20010101T000002.log']);
        await initialize({
            bufferSize: 0,
            keepingFileCount: 1,
            createFile,
            removeFile,
            writeFile,
            getFilenames,
        });

        buffer.push('1');
        buffer.push('2');
        await flush(0);
        expect(buffer).toStrictEqual([]);
        const filenameMatching = expect.stringMatching(/\d{8}T\d{6}.log/);
        expect(createFile).toHaveBeenCalledTimes(1 + 1);
        expect(createFile).toHaveBeenCalledWith(filenameMatching);
        expect(writeFile).toHaveBeenCalledTimes(1 + 1);
        expect(writeFile).toHaveBeenCalledWith(filenameMatching, '1\n2');
        expect(getFilenames).toHaveBeenCalledTimes(1 + 2);
        expect(removeFile).toHaveBeenCalledTimes(1 + 1);
        expect(removeFile).toHaveBeenCalledWith('20010101T000001.log');
    });

    it('retryTimes = 2, failureTimes = 0', async () => {
        const createFile = jest.fn();
        const removeFile = jest.fn();
        const writeFile = jest.fn();
        const getFilenames = jest.fn();
        getFilenames.mockReturnValue([]);
        await initialize({
            bufferSize: 0,
            keepingFileCount: 0,
            createFile,
            removeFile,
            writeFile,
            getFilenames,
        });

        buffer.push('1');
        buffer.push('2');
        await flush(2);
        expect(buffer).toStrictEqual([]);
        const filenameMatching = expect.stringMatching(/\d{8}T\d{6}.log/);
        expect(createFile).toHaveBeenCalledTimes(1 + 1);
        expect(createFile).toHaveBeenCalledWith(filenameMatching);
        expect(writeFile).toHaveBeenCalledTimes(1 + 1);
        expect(writeFile).toHaveBeenCalledWith(filenameMatching, '1\n2');
        expect(getFilenames).toHaveBeenCalledTimes(1 + 1);
        expect(removeFile).toHaveBeenCalledTimes(1);
    });

    it('retryTimes = 2, failureTimes = 1', async () => {
        const createFile = jest.fn();
        const removeFile = jest.fn();
        const writeFile = jest.fn();
        const getFilenames = jest.fn();
        await initialize({
            bufferSize: 0,
            keepingFileCount: 2,
            createFile,
            removeFile,
            writeFile,
            getFilenames,
        });
        getFilenames.mockReturnValue(['20010101T000001.log', '20010101T000002.log']);
        createFile.mockImplementationOnce(() => {
            throw new Error('mock');
        });

        buffer.push('1');
        buffer.push('2');
        await flush(2);
        expect(buffer).toStrictEqual([]);
        const filenameMatching = expect.stringMatching(/\d{8}T\d{6}.log/);
        expect(createFile).toHaveBeenCalledTimes(1 + 2);
        expect(createFile).toHaveBeenCalledWith(filenameMatching);
        expect(writeFile).toHaveBeenCalledTimes(1 + 1);
        expect(writeFile).toHaveBeenCalledWith(filenameMatching, '1\n2');
        expect(getFilenames).toHaveBeenCalledTimes(1 + 3);
        expect(removeFile).toHaveBeenCalledTimes(1 + 1);
        expect(removeFile).toHaveBeenCalledWith('20010101T000001.log');
    });

    it('retryTimes = 2, failureTimes = 2', async () => {
        const createFile = jest.fn();
        const removeFile = jest.fn();
        const writeFile = jest.fn();
        const getFilenames = jest.fn();
        getFilenames.mockReturnValue([]);
        await initialize({
            bufferSize: 0,
            keepingFileCount: 2,
            createFile,
            removeFile,
            writeFile,
            getFilenames,
        });
        createFile.mockImplementation(() => {
            throw new Error('mock');
        });

        await expect(() => flush(2)).rejects.toThrow(LoggerError);
    });
});

describe('log', () => {
    it('not initialized yet', async () => {
        await expect(() => log('')).rejects.toThrow(LoggerError);
    });

    it("didn't flush", async () => {
        const createFile = jest.fn();
        const removeFile = jest.fn();
        const writeFile = jest.fn();
        const getFilenames = jest.fn();
        getFilenames.mockReturnValue([]);
        await initialize({
            bufferSize: 3,
            keepingFileCount: 1,
            createFile,
            removeFile,
            writeFile,
            getFilenames,
        });

        await log('message1');
        expect(buffer.length).toBe(1);
        expect(buffer[0]).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}\+\d{4}\]message1/);

        await log('message2');
        expect(buffer.length).toBe(2);
        expect(buffer[1]).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}\+\d{4}\]message2/);

        await log('message3');
        expect(buffer.length).toBe(3);
        expect(buffer[2]).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}\+\d{4}\]message3/);

        expect(createFile).toHaveBeenCalledTimes(1);
        expect(removeFile).toHaveBeenCalledTimes(1);
        expect(writeFile).toHaveBeenCalledTimes(1);
        expect(getFilenames).toHaveBeenCalledTimes(1);
    });

    it('flush', async () => {
        const createFile = jest.fn();
        const removeFile = jest.fn();
        const writeFile = jest.fn();
        const getFilenames = jest.fn();
        getFilenames.mockReturnValue([]);
        await initialize({
            bufferSize: 1,
            keepingFileCount: 1,
            createFile,
            removeFile,
            writeFile,
            getFilenames,
        });

        await log('message1');
        expect(buffer.length).toBe(1);
        expect(buffer[0]).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}\+\d{4}\]message1/);
        await log('message2');
        expect(buffer).toStrictEqual([]);
        const filenameMatching = expect.stringMatching(/\d{8}T\d{6}.log/);
        expect(createFile).toHaveBeenCalledTimes(1 + 1);
        expect(createFile).toHaveBeenCalledWith(filenameMatching);
        expect(writeFile).toHaveBeenCalledTimes(1 + 1);
        expect(writeFile).toHaveBeenCalledWith(
            filenameMatching,
            expect.stringMatching(
                /\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}\+\d{4}\]message1\n\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}\+\d{4}\]message2/,
            ),
        );

        expect(removeFile).toHaveBeenCalledTimes(1);
        expect(getFilenames).toHaveBeenCalledTimes(1 + 1);
    });
});
