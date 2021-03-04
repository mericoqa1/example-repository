var responseCodeText = {
	100: 'Continue',
	101: 'Switching Protocols',
	200: 'OK',
	201: 'Created',
	202: 'Accepted',
	203: 'Non-Authoritative Information',
	204: 'No Content',
	205: 'Reset Content',
	206: 'Partial Content',
	300: 'Multiple Choices',
	301: 'Moved Permanently',
	302: 'Found',
	303: 'See Other',
	304: 'Not Modified',
	305: 'Use Proxy',
	307: 'Temporary Redirect',
	400: 'Bad Request',
	401: 'Unauthorized',
	402: 'Payment Required', // note RFC says reserved for future use
	403: 'Forbidden',
	404: 'Not Found',
	405: 'Method Not Allowed',
	406: 'Not Acceptable',
	407: 'Proxy Authentication Required',
	408: 'Request Timeout',
	409: 'Conflict',
	410: 'Gone',
	411: 'Length Required',
	412: 'Precondition Failed',
	413: 'Request Entity Too Large',
	414: 'Request-URI Too Long',
	415: 'Unsupported Media Type',
	416: 'Request Range Not Satisfiable',
	417: 'Expectation Failed',
	500: 'Internal Server Error',
	501: 'Not Implemented',
	502: 'Bad Gateway',
	503: 'Service Unavailable',
	504: 'Gateway Timeout',
	505: 'HTTP Version Not SUpported'
};

res = function() {
	var buf = buffer.create();
	var headersSent;
	return {
		sock: 0,
		status: 200,
		contentLength: 0,
		contentType: 'text/html',
		headers: {},
		init: function(sock, keepAlive, requestsHandled) {
			buffer.reset(buf);
			res.apply({
				sock: sock,
				status: 200,
				contentLength: 0,
				contentType: 'text/html',
				cookies: {},
				headers: {
					Server: 'SILK JS Server'
				}
			});
			headersSent = false;
			var ka = req.headers && req.headers.connection;
			if (ka && keepAlive) {
				res.headers.Connection = 'Keep-Alive';
				res.headers['keep-alive'] = 'timeout: 5; max=' + (Config.requestsPerChild - requestsHandled);
			}
			else {
				keepAlive = false;
				res.headers.Connection = 'close';
			}
			return keepAlive;
		},
		stop: function() {
			throw 'RES.STOP';
		},
		reset: function() {
			buffer.reset(buf);
		},
		setCookie: function(key, value, expires, path, domain) {
			var cookie = {
				value: value
			};
			if (expires) {
				expires = Util.isDate(expires) ? expires.toGMTString() : expires;
				cookie.expires = expires;
			}
			if (path) {
				expires.path = path;
			}
			if (domain) {
				expires.domain = domain;
			}
			res.cookies[key] = cookie;
		},
		sendHeaders: function() {
			if (!headersSent) {
				headersSent = true;
				var out = '';
				out += req.proto + ' ' + res.status + ' ' +  responseCodeText[res.status] + '\r\n';
				out += 'Date: ' + new Date().toGMTString() + '\r\n';
				forEach(res.headers, function(value, key) {
					out += key +': ' + value + '\r\n';
				});
				forEach(res.cookies, function(cookie, key) {
					out += 'Set-Cookie: ' + key + '=' +encodeUriComponent(cookie.value);
					if (cookie.expires) {
						out += '; Expires='+cookie.expires;
					}
					if (cookie.path) {
						out += '; Path='+encodeUriComponent(cookie.path);
					}
					if (cookie.domain) {
						out += '; Domain='+encodeUriComponent(cookie.domain);
					}
					out += '\r\n';
				});
				out += 'Content-Type: ' + res.contentType + '\r\n';
				out += 'Content-Length: ' + res.contentLength + '\r\n\r\n';
				try {
                    net.cork(res.sock, true);
					net.write(res.sock, out, out.length);
				}
				catch (e) {
					throw new SilkException(e);
				}
				
			}
		},
		write: function(s) {
			try {
				buffer.write(buf, s, s.length);
			}
			catch (e) {
				throw new SilkException(e);
			}
		},
		flush: function() {
			var len = buffer.size(buf);
			if (len) {
				res.contentLength = len;
				res.sendHeaders();
				net.writeBuffer(res.sock, buf);
			}
			else {
				res.sendHeaders();
			}
			net.cork(res.sock, false);
		},
		redirect: function(uri) {
			res.status = 302;
			var base = 'http://'+req.host;
			if (req.port != 80) {
				base += ':' + req.port;
			}
			res.setHeader('Location', base + uri);
			res.stop();
		},
		close: function() {
			buffer.destroy(buf);
		}
		
	}
}();
