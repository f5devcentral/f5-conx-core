/* eslint-disable @typescript-eslint/no-non-null-assertion */


/**
 * basically a copy/paste from https://github.com/szmarczak/http-timer
 * 
 * the latest version was pure ESM which was causing problem with this project.
 *  so, I had to rework some of it's moduleness to match the blend this project has/needs
 */


import { errorMonitor } from 'events';
import { types } from 'util';
import type { EventEmitter } from 'events';
import type { Socket } from 'net';
import type { ClientRequest, IncomingMessage } from 'http';

export interface HttpTimings {
	start: number;
	socket?: number;
	lookup?: number;
	connect?: number;
	secureConnect?: number;
	upload?: number;
	response?: number;
	end?: number;
	error?: number;
	abort?: number;
	phases: {
		wait?: number;
		dns?: number;
		tcp?: number;
		tls?: number;
		request?: number;
		firstByte?: number;
		download?: number;
		total?: number;
	};
}

export interface ClientRequestWithTimings extends ClientRequest {
	timings?: HttpTimings;
}

export interface IncomingMessageWithTimings extends IncomingMessage {
	timings?: HttpTimings;
}

export function httpTimer(request: ClientRequestWithTimings): HttpTimings {
	if (request.timings) {
		return request.timings;
	}

	const timings: HttpTimings = {
		start: Date.now(),
		socket: undefined,
		lookup: undefined,
		connect: undefined,
		secureConnect: undefined,
		upload: undefined,
		response: undefined,
		end: undefined,
		error: undefined,
		abort: undefined,
		phases: {
			wait: undefined,
			dns: undefined,
			tcp: undefined,
			tls: undefined,
			request: undefined,
			firstByte: undefined,
			download: undefined,
			total: undefined,
		},
	};

	request.timings = timings;

	function handleError(origin: EventEmitter): void {
		origin.once(errorMonitor, () => {
			timings.error = Date.now();
			timings.phases.total = timings.error - timings.start;
		});
	}

	handleError(request);

	function onAbort(): void {
		timings.abort = Date.now();
		timings.phases.total = timings.abort - timings.start;
	}

	request.prependOnceListener('abort', onAbort);

	function onSocket(socket: Socket): void {
		timings.socket = Date.now();
		timings.phases.wait = timings.socket - timings.start;

		if (types.isProxy(socket)) {
			return;
		}

		const lookupListener = (): void => {
			timings.lookup = Date.now();
			timings.phases.dns = timings.lookup - timings.socket!;
		};

		socket.prependOnceListener('lookup', lookupListener);

		deferToConnect(socket, {
			connect: () => {
				timings.connect = Date.now();

				if (timings.lookup === undefined) {
					socket.removeListener('lookup', lookupListener);
					timings.lookup = timings.connect;
					timings.phases.dns = timings.lookup - timings.socket!;
				}

				timings.phases.tcp = timings.connect - timings.lookup;
			},
			secureConnect: () => {
				timings.secureConnect = Date.now();
				timings.phases.tls = timings.secureConnect - timings.connect!;
			},
		});
	}

	if (request.socket) {
		onSocket(request.socket);
	} else {
		request.prependOnceListener('socket', onSocket);
	}

    function onUpload(): void {
        timings.upload = Date.now();
        timings.phases.request = timings.upload - (timings.secureConnect ?? timings.connect!);
    }

	if (request.writableFinished) {
		onUpload();
	} else {
		request.prependOnceListener('finish', onUpload);
	}

	request.prependOnceListener('response', (response: IncomingMessageWithTimings): void => {
		timings.response = Date.now();
		timings.phases.firstByte = timings.response - timings.upload!;

		response.timings = timings;

		handleError(response);

		response.prependOnceListener('end', () => {
			request.off('abort', onAbort);
			response.off('aborted', onAbort);

			if (timings.phases.total) {
				// Aborted or errored
				return;
			}

			timings.end = Date.now();
			timings.phases.download = timings.end - timings.response!;
			timings.phases.total = timings.end - timings.start;
		});

		response.prependOnceListener('aborted', onAbort);
	});

	return timings;
}





// ########################
// ########################
// ########################

/**
 * 
 * this project, from the same person, supports the one above, so we grabbed it also
 * https://github.com/szmarczak/defer-to-connect
 * 
 */


import {TLSSocket} from 'tls';

interface Listeners {
	connect?: () => void;
	secureConnect?: () => void;
	close?: (hadError: boolean) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isTLSSocket(socket: any): socket is TLSSocket {
	return socket.encrypted;
}

function deferToConnect(socket: Socket | TLSSocket, fn: Listeners | (() => void)): void {
	let listeners: Listeners;

	if (typeof fn === 'function') {
		const connect = fn;
		listeners = {connect};
	} else {
		listeners = fn;
	}

	const hasConnectListener = typeof listeners.connect === 'function';
	const hasSecureConnectListener = typeof listeners.secureConnect === 'function';
	const hasCloseListener = typeof listeners.close === 'function';

	function onConnect(): void {
		if (hasConnectListener) {
			listeners.connect!();
		}

		if (isTLSSocket(socket) && hasSecureConnectListener) {
			if (socket.authorized) {
				listeners.secureConnect!();
			} else if (!socket.authorizationError) {
				socket.once('secureConnect', listeners.secureConnect!);
			}
		}

		if (hasCloseListener) {
			socket.once('close', listeners.close!);
		}
	}

	if (socket.writable && !socket.connecting) {
		onConnect();
	} else if (socket.connecting) {
		socket.once('connect', onConnect);
	} else if (socket.destroyed && hasCloseListener) {
		listeners.close!((socket as Socket & {_hadError: boolean})._hadError);
	}
}