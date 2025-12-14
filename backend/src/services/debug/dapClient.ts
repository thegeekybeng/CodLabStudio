import { EventEmitter } from 'events';
import * as net from 'net';

export interface DapMessage {
    seq: number;
    type: 'request' | 'response' | 'event';
    [key: string]: any;
}

export class DapClient extends EventEmitter {
    private socket: net.Socket;
    private seq = 1;
    private pendingRequests = new Map<number, { resolve: (value: any) => void; reject: (reason: any) => void }>();
    private buffer: Buffer = Buffer.alloc(0);
    private contentLength = -1;

    constructor(private host: string, private port: number) {
        super();
        this.socket = new net.Socket();
    }

    connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.socket.connect(this.port, this.host, () => {
                console.log(`[DAP] Connected to ${this.host}:${this.port}`);
                resolve();
            });

            this.socket.on('data', (data) => this.handleData(data));
            this.socket.on('error', (err) => {
                // console.error('[DAP] Socket error:', err);
                // During connection, just reject. Don't emit 'error' yet to avoid unhandled exception in caller.
                reject(err);
            });
            this.socket.on('close', () => {
                console.log('[DAP] Socket closed');
                this.emit('close');
            });
        });
    }

    disconnect(): void {
        this.socket.end();
    }

    sendRequest(command: string, args: any = {}): Promise<any> {
        const seq = this.seq++;
        const request = {
            seq,
            type: 'request',
            command,
            arguments: args,
        };

        const json = JSON.stringify(request);
        const message = `Content-Length: ${Buffer.byteLength(json, 'utf8')}\r\n\r\n${json}`;

        if (command !== 'initialize') {
            console.log(`[DAP] -> Request: ${command}`, JSON.stringify(args));
        } else {
            console.log(`[DAP] -> Request: initialize`);
        }

        return new Promise((resolve, reject) => {
            this.pendingRequests.set(seq, { resolve, reject });
            this.socket.write(message);
        });
    }

    private handleData(data: Buffer) {
        console.log(`[DAP] <- Data chunk: ${data.length} bytes`);
        this.buffer = Buffer.concat([this.buffer, data]);

        while (true) {
            if (this.contentLength === -1) {
                // Looking for Content-Length header separator
                const separatorIndex = this.buffer.indexOf('\r\n\r\n');
                if (separatorIndex !== -1) {
                    const headerPart = this.buffer.slice(0, separatorIndex).toString('utf8');
                    const match = headerPart.match(/Content-Length: (\d+)/);
                    if (match) {
                        this.contentLength = parseInt(match[1], 10);
                        this.buffer = this.buffer.slice(separatorIndex + 4); // Skip \r\n\r\n
                    } else {
                        // Invalid header? Skip it or wait?
                        // Ideally reset, but for now let's hope it's clean DAP
                        console.error('[DAP] Invalid header:', headerPart);
                        this.buffer = this.buffer.slice(separatorIndex + 4);
                    }
                } else {
                    // Need more data for header
                    break;
                }
            }

            if (this.contentLength !== -1) {
                if (this.buffer.length >= this.contentLength) {
                    const contentBuffer = this.buffer.slice(0, this.contentLength);
                    this.buffer = this.buffer.slice(this.contentLength);
                    this.contentLength = -1;

                    try {
                        const content = contentBuffer.toString('utf8');
                        const message = JSON.parse(content);
                        this.handleMessage(message);
                    } catch (err) {
                        console.error('[DAP] Failed to parse message:', err);
                    }
                } else {
                    // Need more data for body
                    break;
                }
            }
        }
    }

    private handleMessage(message: DapMessage) {
        if (message.type === 'response') {
            // ...
        } else if (message.type === 'event') {
            // console.log(`[DAP] <- Event: ${message.event}`, JSON.stringify(message.body));
            this.emit(message.event, message.body);
        }
    }
}
