(function () {
    const proxyMatch = window.location.pathname.match(/^(.*\/proxy\/\d+)(?:\/|$)/);
    const basePath = proxyMatch ? proxyMatch[1] : '';

    function withBasePath(path) {
        if (!path) {
            return basePath || '';
        }

        if (/^(?:[a-z]+:)?\/\//i.test(path)) {
            return path;
        }

        if (path.startsWith('/')) {
            return `${basePath}${path}`;
        }

        if (!basePath) {
            return path;
        }

        return `${basePath}/${path.replace(/^\.?\//, '')}`;
    }

    const originalFetch = window.fetch.bind(window);

    window.APP_BASE_PATH = basePath;
    window.withBasePath = withBasePath;

    window.fetch = function (input, init) {
        if (typeof input === 'string') {
            return originalFetch(withBasePath(input), init);
        }

        if (input instanceof Request) {
            return originalFetch(new Request(withBasePath(input.url), input), init);
        }

        return originalFetch(input, init);
    };
})();
