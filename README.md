# File Logger

A logger is used for writing log messages to files.

## Development

1. Build

    ```shell
    npm run build
    ```

2. Test

    ```shell
    npm run test:cov
    ```

## Usage

Running on the browser.

```javascript
const directoryHandle = await window.showDirectoryPicker();
FileLogger.initialize({
    bufferSize: 3,
    keepingFileCount: 2,
    isLoggingToConsole: true,
    createFile: (filename) => {
        directoryHandle.getFileHandle(filename, { create: true });
    },
    removeFile: (filename) => {
        directoryHandle.removeEntry(filename);
    },
    writeFile: async (filename, text) => {
        let writableStream;
        try {
            const fileHandle = await directoryHandle.getFileHandle(filename);
            writableStream = await fileHandle.createWritable({ keepExistingData: true });

            const file = await fileHandle.getFile();
            await writableStream.seek(file.size);

            await writableStream.write(text);
        } catch (error) {
            throw error;
        } finally {
            if (writableStream) {
                await writableStream.close();
            }
        }
    },
    getFilenames: async () => {
        async function toArray(asyncIterator) {
            const array = [];
            for await (const element of asyncIterator) {
                array.push(element);
            }
            return array;
        }
        return toArray(directoryHandle.keys());
    },
});
```
